//go:build integration
package integration

import (
	"database/sql"
	"os"
	"testing"
	"time"
	"product-service/internal/domain"
	"product-service/internal/repository"
	"product-service/internal/usecase"
	_ "github.com/lib/pq"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

type mockCache struct{}
func (m *mockCache) SetProduct(p *domain.Product) error { return nil }
func (m *mockCache) GetProduct(id string) (*domain.Product, error) { return nil, nil }
func (m *mockCache) InvalidateProduct(id string) error { return nil }
func (m *mockCache) SetProductList(page, limit int, products []*domain.Product) error { return nil }
func (m *mockCache) GetProductList(page, limit int) ([]*domain.Product, error) { return nil, nil }
func (m *mockCache) InvalidateProductList() error { return nil }

func TestProductIntegration_CreateAndGet(t *testing.T) {
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

	repo := repository.NewPostgresProductRepository(db)
	cache := &mockCache{}
	uc := usecase.NewProductUsecase(repo, cache, nil)

	// Ensure categories exist
	catID := "11111111-1111-1111-1111-111111111111"
	_ = repo.CreateCategory(&domain.Category{ID: catID, Name: "clothing"})

	p := &domain.Product{
		Name:        "Integration Test Product " + time.Now().Format("150405"),
		Description: "A fine integration test product.",
		Price:       150.0,
		Stock:       10,
		CategoryID:  catID,
	}

	created, err := uc.CreateProduct(p.Name, p.Description, p.Price, p.Stock, p.CategoryID)
	if err != nil {
		t.Fatalf("Failed to create product: %v", err)
	}

	fetched, err := uc.GetProductByID(created.ID)
	if err != nil {
		t.Fatalf("Failed to fetch product: %v", err)
	}

	if fetched.Name != p.Name {
		t.Errorf("Expected product name %s, got %s", p.Name, fetched.Name)
	}
}
