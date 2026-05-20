package usecase

import (
	"product-service/internal/domain"
	"github.com/nats-io/nats.go"
)

type ProductUsecase struct {
	repo  domain.ProductRepository
	cache domain.CacheRepository
	nc    *nats.Conn
}

func NewProductUsecase(repo domain.ProductRepository, cache domain.CacheRepository, nc *nats.Conn) *ProductUsecase {
	return &ProductUsecase{repo: repo, cache: cache, nc: nc}
}

func (u *ProductUsecase) CreateProduct(name, description string, price float64, stock int, categoryID string) (*domain.Product, error) {
	p := &domain.Product{Name: name, Description: description, Price: price, Stock: stock, CategoryID: categoryID}
	if err := u.repo.CreateProduct(p); err != nil {
		return nil, err
	}
	u.cache.InvalidateProductList()
	return p, nil
}

func (u *ProductUsecase) GetProductByID(id string) (*domain.Product, error) {
	p, err := u.cache.GetProduct(id)
	if err == nil && p != nil {
		return p, nil
	}
	p, err = u.repo.GetProductByID(id)
	if err != nil {
		return nil, err
	}
	u.cache.SetProduct(p)
	return p, nil
}

func (u *ProductUsecase) UpdateProduct(id, name, description string, price float64, categoryID string) (*domain.Product, error) {
	p, err := u.repo.GetProductByID(id)
	if err != nil {
		return nil, err
	}
	p.Name = name
	p.Description = description
	p.Price = price
	p.CategoryID = categoryID
	if err := u.repo.UpdateProduct(p); err != nil {
		return nil, err
	}
	u.cache.InvalidateProduct(id)
	u.cache.InvalidateProductList()
	return p, nil
}

func (u *ProductUsecase) DeleteProduct(id string) error {
	err := u.repo.DeleteProduct(id)
	if err == nil {
		u.cache.InvalidateProduct(id)
		u.cache.InvalidateProductList()
	}
	return err
}

func (u *ProductUsecase) ListProducts(page, limit int) ([]*domain.Product, int, error) {
	products, err := u.cache.GetProductList(page, limit)
	if err == nil && products != nil {
		// Just returning dummy total for cached hit
		return products, len(products), nil
	}
	products, total, err := u.repo.ListProducts(page, limit)
	if err != nil {
		return nil, 0, err
	}
	u.cache.SetProductList(page, limit, products)
	return products, total, nil
}

func (u *ProductUsecase) SearchProducts(query string, page, limit int) ([]*domain.Product, int, error) {
	return u.repo.SearchProducts(query, page, limit)
}

func (u *ProductUsecase) UpdateStock(id string, quantity int) error {
	err := u.repo.UpdateStock(id, quantity)
	if err == nil {
		u.cache.InvalidateProduct(id)
	}
	return err
}

func (u *ProductUsecase) CreateCategory(name string) (*domain.Category, error) {
	c := &domain.Category{Name: name}
	err := u.repo.CreateCategory(c)
	return c, err
}

func (u *ProductUsecase) GetCategory(id string) (*domain.Category, error) {
	return u.repo.GetCategory(id)
}

func (u *ProductUsecase) ListCategories() ([]*domain.Category, error) {
	return u.repo.ListCategories()
}

func (u *ProductUsecase) DeleteCategory(id string) error {
	return u.repo.DeleteCategory(id)
}

func (u *ProductUsecase) GetProductReviews(productID string) ([]*domain.Review, error) {
	return u.repo.GetProductReviews(productID)
}
