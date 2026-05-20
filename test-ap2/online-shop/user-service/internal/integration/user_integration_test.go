//go:build integration
package integration

import (
	"database/sql"
	"os"
	"testing"
	"time"
	"user-service/internal/repository"
	"user-service/internal/usecase"
	_ "github.com/lib/pq"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

type mockUserCache struct{}
func (m *mockUserCache) SetSession(userID, token string, ttl time.Duration) error { return nil }
func (m *mockUserCache) GetSession(token string) (string, error) { return "test-id", nil }
func (m *mockUserCache) DeleteSession(token string) error { return nil }

func TestUserIntegration_RegisterAndLogin(t *testing.T) {
	dbConn := os.Getenv("DATABASE_URL")
	if dbConn == "" {
		t.Skip("Skipping integration test: DATABASE_URL not set")
	}

	db, err := sql.Open("postgres", dbConn)
	if err != nil {
		t.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Run migrations
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err == nil {
		m, err := migrate.NewWithDatabaseInstance("file://../../migrations", "postgres", driver)
		if err == nil {
			_ = m.Up()
		}
	}

	repo := repository.NewPostgresUserRepository(db)
	cache := &mockUserCache{}
	uc := usecase.NewUserUsecase(repo, cache, nil, nil)

	email := "test_integration_" + time.Now().Format("20060102150405") + "@example.com"
	password := "secure123"
	name := "Integration Test User"

	// Test Register
	user, err := uc.Register(email, password, name)
	if err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}
	if user.Email != email {
		t.Errorf("Expected email %s, got %s", email, user.Email)
	}

	// Test Login
	access, refresh, loggedUser, err := uc.Login(email, password)
	if err != nil {
		t.Fatalf("Failed to login: %v", err)
	}
	if loggedUser.ID != user.ID {
		t.Errorf("Expected user ID %s, got %s", user.ID, loggedUser.ID)
	}
	if access == "" || refresh == "" {
		t.Errorf("Expected non-empty access and refresh tokens")
	}
}
