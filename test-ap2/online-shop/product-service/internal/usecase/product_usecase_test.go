package usecase

import (
	"errors"
	"product-service/internal/domain"
	"testing"
)

// Мок ProductRepository
type mockProductRepository struct {
	products map[string]*domain.Product
	dbCalls  int
}

func (m *mockProductRepository) CreateProduct(p *domain.Product) error {
	m.products[p.ID] = p
	return nil
}

func (m *mockProductRepository) GetProductByID(id string) (*domain.Product, error) {
	m.dbCalls++
	p, exists := m.products[id]
	if !exists {
		return nil, errors.New("product not found in db")
	}
	return p, nil
}

func (m *mockProductRepository) UpdateProduct(p *domain.Product) error { return nil }
func (m *mockProductRepository) DeleteProduct(id string) error         { return nil }
func (m *mockProductRepository) ListProducts(page, limit int) ([]*domain.Product, int, error) {
	return nil, 0, nil
}
func (m *mockProductRepository) SearchProducts(query string, page, limit int) ([]*domain.Product, int, error) {
	return nil, 0, nil
}
func (m *mockProductRepository) UpdateStock(id string, qty int) error { return nil }
func (m *mockProductRepository) CreateCategory(c *domain.Category) error { return nil }
func (m *mockProductRepository) GetCategory(id string) (*domain.Category, error) {
	return nil, nil
}
func (m *mockProductRepository) ListCategories() ([]*domain.Category, error) { return nil, nil }
func (m *mockProductRepository) DeleteCategory(id string) error             { return nil }
func (m *mockProductRepository) GetProductReviews(productID string) ([]*domain.Review, error) {
	return nil, nil
}

// Мок CacheRepository
type mockCacheRepository struct {
	cache      map[string]*domain.Product
	cacheCalls int
}

func (m *mockCacheRepository) SetProduct(p *domain.Product) error {
	m.cache[p.ID] = p
	return nil
}

func (m *mockCacheRepository) GetProduct(id string) (*domain.Product, error) {
	m.cacheCalls++
	p, exists := m.cache[id]
	if !exists {
		return nil, errors.New("cache miss")
	}
	return p, nil
}

func (m *mockCacheRepository) InvalidateProduct(id string) error {
	delete(m.cache, id)
	return nil
}

func (m *mockCacheRepository) SetProductList(page, limit int, products []*domain.Product) error {
	return nil
}
func (m *mockCacheRepository) GetProductList(page, limit int) ([]*domain.Product, error) {
	return nil, errors.New("not implemented")
}
func (m *mockCacheRepository) InvalidateProductList() error { return nil }

func TestGetProductByID_CacheFlow(t *testing.T) {
	repo := &mockProductRepository{
		products: map[string]*domain.Product{
			"prod-1": {ID: "prod-1", Name: "Laptop", Price: 999.99},
		},
	}
	cache := &mockCacheRepository{cache: make(map[string]*domain.Product)}
	uc := NewProductUsecase(repo, cache, nil)

	// --- 1. ТЕСТ: Промах кэша (Cache Miss) ---
	// На первом запросе кэш должен вернуть ошибку (промах), а данные должны быть прочитаны из БД и записаны в кэш.
	prod, err := uc.GetProductByID("prod-1")
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}
	if prod.Name != "Laptop" {
		t.Errorf("Expected product 'Laptop', got '%s'", prod.Name)
	}
	if repo.dbCalls != 1 {
		t.Errorf("Expected 1 DB call on cache miss, got %d", repo.dbCalls)
	}

	// --- 2. ТЕСТ: Попадание в кэш (Cache Hit) ---
	// На втором запросе товар уже должен быть в кэше. Обращения к БД (dbCalls) быть НЕ должно.
	prodCached, err := uc.GetProductByID("prod-1")
	if err != nil {
		t.Fatalf("Expected no error on cache hit, got: %v", err)
	}
	if prodCached.Name != "Laptop" {
		t.Errorf("Expected product 'Laptop' from cache, got '%s'", prodCached.Name)
	}
	if repo.dbCalls != 1 {
		t.Errorf("Expected DB calls to remain 1 (no new database query), but got %d", repo.dbCalls)
	}
	if cache.cacheCalls != 2 {
		t.Errorf("Expected 2 cache retrieval queries total, got %d", cache.cacheCalls)
	}
}
