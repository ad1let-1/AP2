package repository

import (
	"database/sql"
	"product-service/internal/domain"
	"github.com/google/uuid"
)

type postgresProductRepository struct {
	db *sql.DB
}

func NewPostgresProductRepository(db *sql.DB) domain.ProductRepository {
	db.Exec(`CREATE TABLE IF NOT EXISTS categories (id UUID PRIMARY KEY, name VARCHAR(255))`)
	db.Exec(`CREATE TABLE IF NOT EXISTS products (
		id UUID PRIMARY KEY, name VARCHAR(255), description TEXT, price FLOAT, stock INT, category_id UUID
	)`)
	db.Exec(`CREATE TABLE IF NOT EXISTS reviews (
		id UUID PRIMARY KEY, user_id UUID, product_id UUID, rating INT, comment TEXT
	)`)
	return &postgresProductRepository{db: db}
}

func (r *postgresProductRepository) CreateProduct(p *domain.Product) error {
	p.ID = uuid.New().String()
	_, err := r.db.Exec("INSERT INTO products (id, name, description, price, stock, category_id) VALUES ($1, $2, $3, $4, $5, $6)",
		p.ID, p.Name, p.Description, p.Price, p.Stock, p.CategoryID)
	return err
}

func (r *postgresProductRepository) GetProductByID(id string) (*domain.Product, error) {
	p := &domain.Product{}
	err := r.db.QueryRow("SELECT id, name, description, price, stock, category_id FROM products WHERE id = $1", id).
		Scan(&p.ID, &p.Name, &p.Description, &p.Price, &p.Stock, &p.CategoryID)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *postgresProductRepository) UpdateProduct(p *domain.Product) error {
	_, err := r.db.Exec("UPDATE products SET name = $1, description = $2, price = $3, category_id = $4 WHERE id = $5",
		p.Name, p.Description, p.Price, p.CategoryID, p.ID)
	return err
}

func (r *postgresProductRepository) DeleteProduct(id string) error {
	_, err := r.db.Exec("DELETE FROM products WHERE id = $1", id)
	return err
}

func (r *postgresProductRepository) ListProducts(page, limit int) ([]*domain.Product, int, error) {
	offset := (page - 1) * limit
	rows, err := r.db.Query("SELECT id, name, description, price, stock, category_id FROM products LIMIT $1 OFFSET $2", limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var products []*domain.Product
	for rows.Next() {
		p := &domain.Product{}
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.Price, &p.Stock, &p.CategoryID); err != nil {
			return nil, 0, err
		}
		products = append(products, p)
	}
	var total int
	r.db.QueryRow("SELECT COUNT(*) FROM products").Scan(&total)
	return products, total, nil
}

func (r *postgresProductRepository) SearchProducts(query string, page, limit int) ([]*domain.Product, int, error) {
	offset := (page - 1) * limit
	rows, err := r.db.Query("SELECT id, name, description, price, stock, category_id FROM products WHERE name ILIKE $1 LIMIT $2 OFFSET $3", "%"+query+"%", limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var products []*domain.Product
	for rows.Next() {
		p := &domain.Product{}
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.Price, &p.Stock, &p.CategoryID); err != nil {
			return nil, 0, err
		}
		products = append(products, p)
	}
	var total int
	r.db.QueryRow("SELECT COUNT(*) FROM products WHERE name ILIKE $1", "%"+query+"%").Scan(&total)
	return products, total, nil
}

func (r *postgresProductRepository) UpdateStock(id string, quantity int) error {
	_, err := r.db.Exec("UPDATE products SET stock = stock + $1 WHERE id = $2", quantity, id)
	return err
}

func (r *postgresProductRepository) CreateCategory(c *domain.Category) error {
	c.ID = uuid.New().String()
	_, err := r.db.Exec("INSERT INTO categories (id, name) VALUES ($1, $2)", c.ID, c.Name)
	return err
}

func (r *postgresProductRepository) GetCategory(id string) (*domain.Category, error) {
	c := &domain.Category{}
	err := r.db.QueryRow("SELECT id, name FROM categories WHERE id = $1", id).Scan(&c.ID, &c.Name)
	if err != nil {
		return nil, err
	}
	return c, nil
}

func (r *postgresProductRepository) ListCategories() ([]*domain.Category, error) {
	rows, err := r.db.Query("SELECT id, name FROM categories")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []*domain.Category
	for rows.Next() {
		c := &domain.Category{}
		if err := rows.Scan(&c.ID, &c.Name); err != nil {
			return nil, err
		}
		categories = append(categories, c)
	}
	return categories, nil
}

func (r *postgresProductRepository) DeleteCategory(id string) error {
	_, err := r.db.Exec("DELETE FROM categories WHERE id = $1", id)
	return err
}

func (r *postgresProductRepository) GetProductReviews(productID string) ([]*domain.Review, error) {
	rows, err := r.db.Query("SELECT id, user_id, product_id, rating, comment FROM reviews WHERE product_id = $1", productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reviews []*domain.Review
	for rows.Next() {
		rev := &domain.Review{}
		if err := rows.Scan(&rev.ID, &rev.UserID, &rev.ProductID, &rev.Rating, &rev.Comment); err != nil {
			return nil, err
		}
		reviews = append(reviews, rev)
	}
	return reviews, nil
}
