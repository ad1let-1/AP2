import os

base_dir = r"c:\Final-AP2\online-shop\user-service"

files = {
    "go.mod": """module user-service

go 1.21

require (
	github.com/golang-jwt/jwt/v5 v5.2.0
	github.com/lib/pq v1.10.9
	github.com/nats-io/nats.go v1.31.0
	golang.org/x/crypto v0.17.0
	google.golang.org/grpc v1.60.1
	google.golang.org/protobuf v1.32.0
)
""",
    "cmd/main.go": """package main

import (
	"log"
	"net"
	"os"

	"user-service/internal/delivery/grpc"
	"user-service/internal/repository"
	"user-service/internal/usecase"
	pb "online-shop/pb"

	"github.com/nats-io/nats.go"
	"google.golang.org/grpc"
	"database/sql"
	_ "github.com/lib/pq"
)

func main() {
	dbConn := os.Getenv("DATABASE_URL")
	if dbConn == "" {
		dbConn = "postgres://postgres:bekarys7@localhost:5432/userdb?sslmode=disable"
	}
	db, err := sql.Open("postgres", dbConn)
	if err != nil {
		log.Fatal(err)
	}

	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = nats.DefaultURL
	}
	nc, err := nats.Connect(natsURL)
	if err != nil {
		log.Fatal(err)
	}
	defer nc.Close()

	userRepo := repository.NewPostgresUserRepository(db)
	userUsecase := usecase.NewUserUsecase(userRepo, nc)
	userHandler := grpc.NewUserHandler(userUsecase)

	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterUserServiceServer(grpcServer, userHandler)

	log.Println("User Service is running on port 50051...")
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
""",
    "internal/domain/user.go": """package domain

import "time"

type User struct {
	ID         string
	Email      string
	Password   string
	Name       string
	IsVerified bool
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

type UserRepository interface {
	Create(user *User) error
	GetByID(id string) (*User, error)
	GetByEmail(email string) (*User, error)
	Update(user *User) error
	Delete(id string) error
	List(page, limit int) ([]*User, int, error)
}
""",
    "internal/repository/postgres_user.go": """package repository

import (
	"database/sql"
	"errors"
	"user-service/internal/domain"
	"github.com/google/uuid"
	"time"
)

type postgresUserRepository struct {
	db *sql.DB
}

func NewPostgresUserRepository(db *sql.DB) domain.UserRepository {
	// Auto migrate
	db.Exec(`CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY,
		email VARCHAR(255) UNIQUE NOT NULL,
		password VARCHAR(255) NOT NULL,
		name VARCHAR(255),
		is_verified BOOLEAN DEFAULT FALSE,
		created_at TIMESTAMP,
		updated_at TIMESTAMP
	)`)
	return &postgresUserRepository{db: db}
}

func (r *postgresUserRepository) Create(u *domain.User) error {
	u.ID = uuid.New().String()
	u.CreatedAt = time.Now()
	u.UpdatedAt = time.Now()
	_, err := r.db.Exec("INSERT INTO users (id, email, password, name, is_verified, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
		u.ID, u.Email, u.Password, u.Name, u.IsVerified, u.CreatedAt, u.UpdatedAt)
	return err
}

func (r *postgresUserRepository) GetByID(id string) (*domain.User, error) {
	u := &domain.User{}
	err := r.db.QueryRow("SELECT id, email, password, name, is_verified, created_at, updated_at FROM users WHERE id = $1", id).
		Scan(&u.ID, &u.Email, &u.Password, &u.Name, &u.IsVerified, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (r *postgresUserRepository) GetByEmail(email string) (*domain.User, error) {
	u := &domain.User{}
	err := r.db.QueryRow("SELECT id, email, password, name, is_verified, created_at, updated_at FROM users WHERE email = $1", email).
		Scan(&u.ID, &u.Email, &u.Password, &u.Name, &u.IsVerified, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (r *postgresUserRepository) Update(u *domain.User) error {
	u.UpdatedAt = time.Now()
	_, err := r.db.Exec("UPDATE users SET name = $1, is_verified = $2, updated_at = $3 WHERE id = $4",
		u.Name, u.IsVerified, u.UpdatedAt, u.ID)
	return err
}

func (r *postgresUserRepository) Delete(id string) error {
	_, err := r.db.Exec("DELETE FROM users WHERE id = $1", id)
	return err
}

func (r *postgresUserRepository) List(page, limit int) ([]*domain.User, int, error) {
	offset := (page - 1) * limit
	rows, err := r.db.Query("SELECT id, email, name, is_verified, created_at, updated_at FROM users LIMIT $1 OFFSET $2", limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		u := &domain.User{}
		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.IsVerified, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, 0, err
		}
		users = append(users, u)
	}
	
	var total int
	r.db.QueryRow("SELECT COUNT(*) FROM users").Scan(&total)
	return users, total, nil
}
""",
    "internal/usecase/user_usecase.go": """package usecase

import (
	"errors"
	"time"
	"user-service/internal/domain"
	"github.com/nats-io/nats.go"
	"golang.org/x/crypto/bcrypt"
	"github.com/golang-jwt/jwt/v5"
	"encoding/json"
)

type UserUsecase struct {
	repo domain.UserRepository
	nc   *nats.Conn
}

func NewUserUsecase(repo domain.UserRepository, nc *nats.Conn) *UserUsecase {
	return &UserUsecase{repo: repo, nc: nc}
}

func (u *UserUsecase) Register(email, password, name string) (*domain.User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	user := &domain.User{
		Email:    email,
		Password: string(hashedPassword),
		Name:     name,
	}
	if err := u.repo.Create(user); err != nil {
		return nil, err
	}
	// Publish event
	eventData, _ := json.Marshal(map[string]string{"email": user.Email, "id": user.ID})
	u.nc.Publish("user.created", eventData)
	return user, nil
}

func (u *UserUsecase) Login(email, password string) (string, string, *domain.User, error) {
	user, err := u.repo.GetByEmail(email)
	if err != nil {
		return "", "", nil, errors.New("invalid credentials")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", "", nil, errors.New("invalid credentials")
	}
	
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id": user.ID,
		"exp": time.Now().Add(time.Minute * 15).Unix(),
	})
	accessTokenString, _ := accessToken.SignedString([]byte("secret"))

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id": user.ID,
		"exp": time.Now().Add(time.Hour * 24 * 7).Unix(),
	})
	refreshTokenString, _ := refreshToken.SignedString([]byte("secret"))

	return accessTokenString, refreshTokenString, user, nil
}

func (u *UserUsecase) GetByID(id string) (*domain.User, error) {
	return u.repo.GetByID(id)
}

func (u *UserUsecase) Update(id, name string) (*domain.User, error) {
	user, err := u.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	user.Name = name
	if err := u.repo.Update(user); err != nil {
		return nil, err
	}
	return user, nil
}

func (u *UserUsecase) Delete(id string) error {
	return u.repo.Delete(id)
}

func (u *UserUsecase) VerifyEmail(token string) error {
	// Dummy token verification
	return nil
}

func (u *UserUsecase) ChangePassword(id, oldPassword, newPassword string) error {
	user, err := u.repo.GetByID(id)
	if err != nil {
		return err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(oldPassword)); err != nil {
		return errors.New("invalid old password")
	}
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	user.Password = string(hashedPassword)
	return u.repo.Update(user)
}

func (u *UserUsecase) List(page, limit int) ([]*domain.User, int, error) {
	return u.repo.List(page, limit)
}
""",
    "internal/delivery/grpc/handler.go": """package grpc

import (
	"context"
	pb "online-shop/pb"
	"user-service/internal/usecase"
	"time"
)

type UserHandler struct {
	pb.UnimplementedUserServiceServer
	usecase *usecase.UserUsecase
}

func NewUserHandler(usecase *usecase.UserUsecase) *UserHandler {
	return &UserHandler{usecase: usecase}
}

func (h *UserHandler) RegisterUser(ctx context.Context, req *pb.RegisterUserRequest) (*pb.RegisterUserResponse, error) {
	user, err := h.usecase.Register(req.Email, req.Password, req.Name)
	if err != nil {
		return nil, err
	}
	return &pb.RegisterUserResponse{
		User: &pb.User{
			Id: user.ID, Email: user.Email, Name: user.Name, IsVerified: user.IsVerified,
			CreatedAt: user.CreatedAt.Format(time.RFC3339), UpdatedAt: user.UpdatedAt.Format(time.RFC3339),
		},
	}, nil
}

func (h *UserHandler) LoginUser(ctx context.Context, req *pb.LoginUserRequest) (*pb.LoginUserResponse, error) {
	access, refresh, user, err := h.usecase.Login(req.Email, req.Password)
	if err != nil {
		return nil, err
	}
	return &pb.LoginUserResponse{
		AccessToken: access, RefreshToken: refresh,
		User: &pb.User{
			Id: user.ID, Email: user.Email, Name: user.Name, IsVerified: user.IsVerified,
			CreatedAt: user.CreatedAt.Format(time.RFC3339), UpdatedAt: user.UpdatedAt.Format(time.RFC3339),
		},
	}, nil
}

func (h *UserHandler) RefreshToken(ctx context.Context, req *pb.RefreshTokenRequest) (*pb.RefreshTokenResponse, error) {
	return &pb.RefreshTokenResponse{AccessToken: "new_dummy_token"}, nil
}

func (h *UserHandler) Logout(ctx context.Context, req *pb.LogoutRequest) (*pb.LogoutResponse, error) {
	return &pb.LogoutResponse{Success: true}, nil
}

func (h *UserHandler) GetUserByID(ctx context.Context, req *pb.GetUserByIDRequest) (*pb.GetUserByIDResponse, error) {
	user, err := h.usecase.GetByID(req.Id)
	if err != nil {
		return nil, err
	}
	return &pb.GetUserByIDResponse{
		User: &pb.User{
			Id: user.ID, Email: user.Email, Name: user.Name, IsVerified: user.IsVerified,
		},
	}, nil
}

func (h *UserHandler) GetMe(ctx context.Context, req *pb.GetMeRequest) (*pb.GetMeResponse, error) {
	user, err := h.usecase.GetByID(req.Id)
	if err != nil {
		return nil, err
	}
	return &pb.GetMeResponse{
		User: &pb.User{
			Id: user.ID, Email: user.Email, Name: user.Name, IsVerified: user.IsVerified,
		},
	}, nil
}

func (h *UserHandler) UpdateUser(ctx context.Context, req *pb.UpdateUserRequest) (*pb.UpdateUserResponse, error) {
	user, err := h.usecase.Update(req.Id, req.Name)
	if err != nil {
		return nil, err
	}
	return &pb.UpdateUserResponse{
		User: &pb.User{
			Id: user.ID, Email: user.Email, Name: user.Name, IsVerified: user.IsVerified,
		},
	}, nil
}

func (h *UserHandler) DeleteUser(ctx context.Context, req *pb.DeleteUserRequest) (*pb.DeleteUserResponse, error) {
	err := h.usecase.Delete(req.Id)
	return &pb.DeleteUserResponse{Success: err == nil}, err
}

func (h *UserHandler) ChangePassword(ctx context.Context, req *pb.ChangePasswordRequest) (*pb.ChangePasswordResponse, error) {
	err := h.usecase.ChangePassword(req.Id, req.OldPassword, req.NewPassword)
	return &pb.ChangePasswordResponse{Success: err == nil}, err
}

func (h *UserHandler) VerifyEmail(ctx context.Context, req *pb.VerifyEmailRequest) (*pb.VerifyEmailResponse, error) {
	err := h.usecase.VerifyEmail(req.Token)
	return &pb.VerifyEmailResponse{Success: err == nil}, err
}

func (h *UserHandler) ResendVerification(ctx context.Context, req *pb.ResendVerificationRequest) (*pb.ResendVerificationResponse, error) {
	return &pb.ResendVerificationResponse{Success: true}, nil
}

func (h *UserHandler) ListUsers(ctx context.Context, req *pb.ListUsersRequest) (*pb.ListUsersResponse, error) {
	users, total, err := h.usecase.List(int(req.Page), int(req.Limit))
	if err != nil {
		return nil, err
	}
	var pbUsers []*pb.User
	for _, u := range users {
		pbUsers = append(pbUsers, &pb.User{
			Id: u.ID, Email: u.Email, Name: u.Name, IsVerified: u.IsVerified,
		})
	}
	return &pb.ListUsersResponse{Users: pbUsers, Total: int32(total)}, nil
}
"""
}

for path, content in files.items():
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
print("User Service Generated")
