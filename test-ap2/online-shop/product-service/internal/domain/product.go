package domain

type Product struct {
	ID          string
	Name        string
	Description string
	Price       float64
	Stock       int
	CategoryID  string
}

type Category struct {
	ID   string
	Name string
}

type Review struct {
	ID        string
	UserID    string
	ProductID string
	Rating    int
	Comment   string
}

type ProductRepository interface {
	CreateProduct(p *Product) error
	GetProductByID(id string) (*Product, error)
	UpdateProduct(p *Product) error
	DeleteProduct(id string) error
	ListProducts(page, limit int) ([]*Product, int, error)
	SearchProducts(query string, page, limit int) ([]*Product, int, error)
	UpdateStock(id string, quantity int) error
	
	CreateCategory(c *Category) error
	GetCategory(id string) (*Category, error)
	ListCategories() ([]*Category, error)
	DeleteCategory(id string) error
	
	GetProductReviews(productID string) ([]*Review, error)
}

type CacheRepository interface {
	SetProduct(p *Product) error
	GetProduct(id string) (*Product, error)
	InvalidateProduct(id string) error
	SetProductList(page, limit int, products []*Product) error
	GetProductList(page, limit int) ([]*Product, error)
	InvalidateProductList() error
}
