//go:build integration
package integration

import (
	"database/sql"
	"os"
	"testing"
	"order-service/internal/domain"
	"order-service/internal/repository"
	"order-service/internal/usecase"
	_ "github.com/lib/pq"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

type mockOrderCache struct{}
func (m *mockOrderCache) SetOrder(o *domain.Order) error { return nil }
func (m *mockOrderCache) GetOrder(id string) (*domain.Order, error) { return nil, nil }
func (m *mockOrderCache) InvalidateOrder(id string) error { return nil }

func TestOrderIntegration_CreateAndCancel(t *testing.T) {
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

	repo := repository.NewPostgresOrderRepository(db)
	cache := &mockOrderCache{}
	uc := usecase.NewOrderUsecase(repo, cache, nil)

	userID := "22222222-2222-2222-2222-222222222222"
	items := []domain.OrderItem{
		{ProductID: "a1111111-1111-1111-1111-111111111111", Quantity: 2, Price: 100.0},
	}

	// Test Create
	order, err := uc.CreateOrder(userID, items)
	if err != nil {
		t.Fatalf("Failed to create order: %v", err)
	}
	if order.UserID != userID {
		t.Errorf("Expected userID %s, got %s", userID, order.UserID)
	}
	if order.Status != "CREATED" {
		t.Errorf("Expected status CREATED, got %s", order.Status)
	}

	// Test Cancel
	err = uc.CancelOrder(order.ID)
	if err != nil {
		t.Fatalf("Failed to cancel order: %v", err)
	}

	fetched, err := uc.GetOrderByID(order.ID)
	if err != nil {
		t.Fatalf("Failed to fetch order: %v", err)
	}
	if fetched.Status != "CANCELLED" {
		t.Errorf("Expected status CANCELLED, got %s", fetched.Status)
	}
}
