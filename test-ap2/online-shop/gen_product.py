import os

base_dir = r"c:\Final-AP2\online-shop\product-service"

files = {
    "go.mod": """module product-service

go 1.21

require (
	github.com/lib/pq v1.10.9
	github.com/nats-io/nats.go v1.31.0
	github.com/redis/go-redis/v9 v9.4.0
	google.golang.org/grpc v1.60.1
	google.golang.org/protobuf v1.32.0
)
""",
    "cmd/main.go": """package main

import (
	"log"
	"net"
	"os"

	"product-service/internal/delivery/grpc"
	"product-service/internal/repository"
	"product-service/internal/usecase"
	pb "online-shop/pb"

	"github.com/nats-io/nats.go"
	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc"
	"database/sql"
	_ "github.com/lib/pq"
)

func main() {
	dbConn := os.Getenv("DATABASE_URL")
	if dbConn == "" {
		dbConn = "postgres://postgres:bekarys7@localhost:5432/productdb?sslmode=disable"
	}
	db, err := sql.Open("postgres", dbConn)
	if err != nil {
		log.Fatal(err)
	}

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}
	rdb := redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})

	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = nats.DefaultURL
	}
	nc, err := nats.Connect(natsURL)
	if err != nil {
		log.Fatal(err)
	}
	defer nc.Close()

	productRepo := repository.NewPostgresProductRepository(db)
	cacheRepo := repository.NewRedisCacheRepository(rdb)
	productUsecase := usecase.NewProductUsecase(productRepo, cacheRepo, nc)
	productHandler := grpc.NewProductHandler(productUsecase)

	lis, err := net.Listen("tcp", ":50052")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterProductServiceServer(grpcServer, productHandler)

	log.Println("Product Service is running on port 50052...")
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
""",
    "internal/domain/product.go": """package domain

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
""",
    "internal/repository/postgres_product.go": """package repository

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
""",
    "internal/repository/redis_cache.go": """package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"product-service/internal/domain"
	"github.com/redis/go-redis/v9"
	"time"
)

type redisCacheRepository struct {
	client *redis.Client
	ctx    context.Context
}

func NewRedisCacheRepository(client *redis.Client) domain.CacheRepository {
	return &redisCacheRepository{client: client, ctx: context.Background()}
}

func (r *redisCacheRepository) SetProduct(p *domain.Product) error {
	data, _ := json.Marshal(p)
	return r.client.Set(r.ctx, "product:"+p.ID, data, time.Minute*10).Err()
}

func (r *redisCacheRepository) GetProduct(id string) (*domain.Product, error) {
	data, err := r.client.Get(r.ctx, "product:"+id).Bytes()
	if err != nil {
		return nil, err
	}
	p := &domain.Product{}
	err = json.Unmarshal(data, p)
	return p, err
}

func (r *redisCacheRepository) InvalidateProduct(id string) error {
	return r.client.Del(r.ctx, "product:"+id).Err()
}

func (r *redisCacheRepository) SetProductList(page, limit int, products []*domain.Product) error {
	data, _ := json.Marshal(products)
	key := fmt.Sprintf("products:page:%d:limit:%d", page, limit)
	return r.client.Set(r.ctx, key, data, time.Minute*5).Err()
}

func (r *redisCacheRepository) GetProductList(page, limit int) ([]*domain.Product, error) {
	key := fmt.Sprintf("products:page:%d:limit:%d", page, limit)
	data, err := r.client.Get(r.ctx, key).Bytes()
	if err != nil {
		return nil, err
	}
	var products []*domain.Product
	err = json.Unmarshal(data, &products)
	return products, err
}

func (r *redisCacheRepository) InvalidateProductList() error {
	keys, err := r.client.Keys(r.ctx, "products:page:*").Result()
	if err != nil {
		return err
	}
	for _, key := range keys {
		r.client.Del(r.ctx, key)
	}
	return nil
}
""",
    "internal/usecase/product_usecase.go": """package usecase

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
	if err == nil {
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
	if err == nil {
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
""",
    "internal/delivery/grpc/handler.go": """package grpc

import (
	"context"
	pb "online-shop/pb"
	"product-service/internal/usecase"
)

type ProductHandler struct {
	pb.UnimplementedProductServiceServer
	usecase *usecase.ProductUsecase
}

func NewProductHandler(usecase *usecase.ProductUsecase) *ProductHandler {
	return &ProductHandler{usecase: usecase}
}

func (h *ProductHandler) CreateProduct(ctx context.Context, req *pb.CreateProductRequest) (*pb.CreateProductResponse, error) {
	p, err := h.usecase.CreateProduct(req.Name, req.Description, req.Price, int(req.Stock), req.CategoryId)
	if err != nil {
		return nil, err
	}
	return &pb.CreateProductResponse{Product: &pb.Product{Id: p.ID, Name: p.Name, Description: p.Description, Price: p.Price, Stock: int32(p.Stock), CategoryId: p.CategoryID}}, nil
}

func (h *ProductHandler) GetProductByID(ctx context.Context, req *pb.GetProductByIDRequest) (*pb.GetProductByIDResponse, error) {
	p, err := h.usecase.GetProductByID(req.Id)
	if err != nil {
		return nil, err
	}
	return &pb.GetProductByIDResponse{Product: &pb.Product{Id: p.ID, Name: p.Name, Description: p.Description, Price: p.Price, Stock: int32(p.Stock), CategoryId: p.CategoryID}}, nil
}

func (h *ProductHandler) UpdateProduct(ctx context.Context, req *pb.UpdateProductRequest) (*pb.UpdateProductResponse, error) {
	p, err := h.usecase.UpdateProduct(req.Id, req.Name, req.Description, req.Price, req.CategoryId)
	if err != nil {
		return nil, err
	}
	return &pb.UpdateProductResponse{Product: &pb.Product{Id: p.ID, Name: p.Name, Description: p.Description, Price: p.Price, Stock: int32(p.Stock), CategoryId: p.CategoryID}}, nil
}

func (h *ProductHandler) DeleteProduct(ctx context.Context, req *pb.DeleteProductRequest) (*pb.DeleteProductResponse, error) {
	err := h.usecase.DeleteProduct(req.Id)
	return &pb.DeleteProductResponse{Success: err == nil}, err
}

func (h *ProductHandler) ListProducts(ctx context.Context, req *pb.ListProductsRequest) (*pb.ListProductsResponse, error) {
	products, total, err := h.usecase.ListProducts(int(req.Page), int(req.Limit))
	if err != nil {
		return nil, err
	}
	var pbProducts []*pb.Product
	for _, p := range products {
		pbProducts = append(pbProducts, &pb.Product{Id: p.ID, Name: p.Name, Description: p.Description, Price: p.Price, Stock: int32(p.Stock), CategoryId: p.CategoryID})
	}
	return &pb.ListProductsResponse{Products: pbProducts, Total: int32(total)}, nil
}

func (h *ProductHandler) SearchProducts(ctx context.Context, req *pb.SearchProductsRequest) (*pb.SearchProductsResponse, error) {
	products, total, err := h.usecase.SearchProducts(req.Query, int(req.Page), int(req.Limit))
	if err != nil {
		return nil, err
	}
	var pbProducts []*pb.Product
	for _, p := range products {
		pbProducts = append(pbProducts, &pb.Product{Id: p.ID, Name: p.Name, Description: p.Description, Price: p.Price, Stock: int32(p.Stock), CategoryId: p.CategoryID})
	}
	return &pb.SearchProductsResponse{Products: pbProducts, Total: int32(total)}, nil
}

func (h *ProductHandler) CreateCategory(ctx context.Context, req *pb.CreateCategoryRequest) (*pb.CreateCategoryResponse, error) {
	c, err := h.usecase.CreateCategory(req.Name)
	if err != nil {
		return nil, err
	}
	return &pb.CreateCategoryResponse{Category: &pb.Category{Id: c.ID, Name: c.Name}}, nil
}

func (h *ProductHandler) GetCategory(ctx context.Context, req *pb.GetCategoryRequest) (*pb.GetCategoryResponse, error) {
	c, err := h.usecase.GetCategory(req.Id)
	if err != nil {
		return nil, err
	}
	return &pb.GetCategoryResponse{Category: &pb.Category{Id: c.ID, Name: c.Name}}, nil
}

func (h *ProductHandler) ListCategories(ctx context.Context, req *pb.ListCategoriesRequest) (*pb.ListCategoriesResponse, error) {
	cats, err := h.usecase.ListCategories()
	if err != nil {
		return nil, err
	}
	var pbCats []*pb.Category
	for _, c := range cats {
		pbCats = append(pbCats, &pb.Category{Id: c.ID, Name: c.Name})
	}
	return &pb.ListCategoriesResponse{Categories: pbCats}, nil
}

func (h *ProductHandler) DeleteCategory(ctx context.Context, req *pb.DeleteCategoryRequest) (*pb.DeleteCategoryResponse, error) {
	err := h.usecase.DeleteCategory(req.Id)
	return &pb.DeleteCategoryResponse{Success: err == nil}, err
}

func (h *ProductHandler) UpdateStock(ctx context.Context, req *pb.UpdateStockRequest) (*pb.UpdateStockResponse, error) {
	err := h.usecase.UpdateStock(req.ProductId, int(req.Quantity))
	return &pb.UpdateStockResponse{Success: err == nil}, err
}

func (h *ProductHandler) GetProductReviews(ctx context.Context, req *pb.GetProductReviewsRequest) (*pb.GetProductReviewsResponse, error) {
	revs, err := h.usecase.GetProductReviews(req.ProductId)
	if err != nil {
		return nil, err
	}
	var pbRevs []*pb.Review
	for _, r := range revs {
		pbRevs = append(pbRevs, &pb.Review{Id: r.ID, UserId: r.UserID, ProductId: r.ProductID, Rating: int32(r.Rating), Comment: r.Comment})
	}
	return &pb.GetProductReviewsResponse{Reviews: pbRevs}, nil
}
"""
}

for path, content in files.items():
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
print("Product Service Generated")
