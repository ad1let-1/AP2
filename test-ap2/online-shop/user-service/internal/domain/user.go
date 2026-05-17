package domain

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
