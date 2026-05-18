package repository

import (
	"database/sql"
	"user-service/internal/domain"
	"github.com/google/uuid"
	"time"
	"golang.org/x/crypto/bcrypt"
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

	// Seed admin
	var adminExists bool
	db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = 'admin@gmail.com')").Scan(&adminExists)
	if !adminExists {
		hashedAdminPassword, _ := bcrypt.GenerateFromPassword([]byte("admin"), bcrypt.DefaultCost)
		db.Exec("INSERT INTO users (id, email, password, name, is_verified, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
			uuid.New().String(), "admin@gmail.com", string(hashedAdminPassword), "Administrator", true, time.Now(), time.Now())
	}

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
