package usecase

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
