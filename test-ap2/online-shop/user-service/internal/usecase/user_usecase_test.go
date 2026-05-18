package usecase

import (
	"errors"
	"testing"
	"user-service/internal/domain"
)

// Мок UserRepository для тестов
type mockUserRepository struct {
	users map[string]*domain.User
}

func (m *mockUserRepository) Create(u *domain.User) error {
	if _, exists := m.users[u.Email]; exists {
		return errors.New("user already exists")
	}
	m.users[u.Email] = u
	return nil
}

func (m *mockUserRepository) GetByID(id string) (*domain.User, error) {
	for _, u := range m.users {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, errors.New("not found")
}

func (m *mockUserRepository) GetByEmail(email string) (*domain.User, error) {
	u, exists := m.users[email]
	if !exists {
		return nil, errors.New("not found")
	}
	return u, nil
}

func (m *mockUserRepository) Update(u *domain.User) error          { return nil }
func (m *mockUserRepository) Delete(id string) error               { return nil }
func (m *mockUserRepository) List(page, limit int) ([]*domain.User, int, error) {
	return nil, 0, nil
}

func TestRegisterUser(t *testing.T) {
	repo := &mockUserRepository{users: make(map[string]*domain.User)}
	// Инициализируем usecase без NATS (передаем nil, так как мы пишем unit-тест)
	uc := NewUserUsecase(repo, nil)

	// Тест-кейс 1: Успешная регистрация
	user, err := uc.Register("test@example.com", "password123", "John Doe")
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if user.Email != "test@example.com" {
		t.Errorf("Expected email to be test@example.com, got %s", user.Email)
	}

	if user.Name != "John Doe" {
		t.Errorf("Expected name to be John Doe, got %s", user.Name)
	}

	// Тест-кейс 2: Повторная регистрация с тем же email (должна вернуть ошибку)
	_, err = uc.Register("test@example.com", "newpassword", "Duplicate")
	if err == nil {
		t.Error("Expected error for duplicate email registration, got nil")
	}
}
