import os

base_dir = r"c:\Final-AP2\online-shop\order-service"

files = {
    "go.mod": """module order-service

go 1.21

require (
	github.com/lib/pq v1.10.9
	github.com/nats-io/nats.go v1.31.0
	google.golang.org/grpc v1.60.1
	google.golang.org/protobuf v1.32.0
)
""",
    "cmd/main.go": """package main

import (
	"log"
	"net"
	"os"

	"order-service/internal/delivery/grpc"
	"order-service/internal/repository"
	"order-service/internal/usecase"
	pb "online-shop/pb"

	"github.com/nats-io/nats.go"
	"google.golang.org/grpc"
	"database/sql"
	_ "github.com/lib/pq"
)

func main() {
	dbConn := os.Getenv("DATABASE_URL")
	if dbConn == "" {
		dbConn = "postgres://postgres:bekarys7@localhost:5432/orderdb?sslmode=disable"
	}
	db, err := sql.Open("postgres", dbConn)
	if err != nil {
		log.Fatal(err)
	}

	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = nats.DefaultURL
	}
	nc, err := nats.Connect(natsURL)
	if err != nil {
		log.Fatal(err)
	}
	defer nc.Close()

	orderRepo := repository.NewPostgresOrderRepository(db)
	orderUsecase := usecase.NewOrderUsecase(orderRepo, nc)
	orderHandler := grpc.NewOrderHandler(orderUsecase)

	lis, err := net.Listen("tcp", ":50053")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterOrderServiceServer(grpcServer, orderHandler)

	log.Println("Order Service is running on port 50053...")
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
""",
    "internal/domain/order.go": """package domain

import "time"

type OrderItem struct {
	ProductID string
	Quantity  int
	Price     float64
}

type Order struct {
	ID          string
	UserID      string
	Items       []OrderItem
	TotalAmount float64
	Status      string
	CreatedAt   time.Time
}

type Payment struct {
	ID            string
	OrderID       string
	PaymentMethod string
	Status        string
}

type OrderRepository interface {
	CreateOrder(o *Order) error
	GetOrderByID(id string) (*Order, error)
	ListOrders(userID string, page, limit int) ([]*Order, int, error)
	UpdateOrderStatus(id, status string) error
	
	CreatePayment(p *Payment) error
	GetPayment(id string) (*Payment, error)
}
""",
    "internal/repository/postgres_order.go": """package repository

import (
	"database/sql"
	"encoding/json"
	"order-service/internal/domain"
	"github.com/google/uuid"
	"time"
)

type postgresOrderRepository struct {
	db *sql.DB
}

func NewPostgresOrderRepository(db *sql.DB) domain.OrderRepository {
	db.Exec(`CREATE TABLE IF NOT EXISTS orders (
		id UUID PRIMARY KEY, user_id UUID, items JSONB, total_amount FLOAT, status VARCHAR(50), created_at TIMESTAMP
	)`)
	db.Exec(`CREATE TABLE IF NOT EXISTS payments (
		id UUID PRIMARY KEY, order_id UUID, payment_method VARCHAR(50), status VARCHAR(50)
	)`)
	return &postgresOrderRepository{db: db}
}

func (r *postgresOrderRepository) CreateOrder(o *domain.Order) error {
	o.ID = uuid.New().String()
	o.CreatedAt = time.Now()
	itemsJSON, _ := json.Marshal(o.Items)
	_, err := r.db.Exec("INSERT INTO orders (id, user_id, items, total_amount, status, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
		o.ID, o.UserID, itemsJSON, o.TotalAmount, o.Status, o.CreatedAt)
	return err
}

func (r *postgresOrderRepository) GetOrderByID(id string) (*domain.Order, error) {
	o := &domain.Order{}
	var itemsJSON []byte
	err := r.db.QueryRow("SELECT id, user_id, items, total_amount, status, created_at FROM orders WHERE id = $1", id).
		Scan(&o.ID, &o.UserID, &itemsJSON, &o.TotalAmount, &o.Status, &o.CreatedAt)
	if err != nil {
		return nil, err
	}
	json.Unmarshal(itemsJSON, &o.Items)
	return o, nil
}

func (r *postgresOrderRepository) ListOrders(userID string, page, limit int) ([]*domain.Order, int, error) {
	offset := (page - 1) * limit
	rows, err := r.db.Query("SELECT id, user_id, items, total_amount, status, created_at FROM orders WHERE user_id = $1 LIMIT $2 OFFSET $3", userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var orders []*domain.Order
	for rows.Next() {
		o := &domain.Order{}
		var itemsJSON []byte
		if err := rows.Scan(&o.ID, &o.UserID, &itemsJSON, &o.TotalAmount, &o.Status, &o.CreatedAt); err != nil {
			return nil, 0, err
		}
		json.Unmarshal(itemsJSON, &o.Items)
		orders = append(orders, o)
	}
	var total int
	r.db.QueryRow("SELECT COUNT(*) FROM orders WHERE user_id = $1", userID).Scan(&total)
	return orders, total, nil
}

func (r *postgresOrderRepository) UpdateOrderStatus(id, status string) error {
	_, err := r.db.Exec("UPDATE orders SET status = $1 WHERE id = $2", status, id)
	return err
}

func (r *postgresOrderRepository) CreatePayment(p *domain.Payment) error {
	p.ID = uuid.New().String()
	_, err := r.db.Exec("INSERT INTO payments (id, order_id, payment_method, status) VALUES ($1, $2, $3, $4)",
		p.ID, p.OrderID, p.PaymentMethod, p.Status)
	return err
}

func (r *postgresOrderRepository) GetPayment(id string) (*domain.Payment, error) {
	p := &domain.Payment{}
	err := r.db.QueryRow("SELECT id, order_id, payment_method, status FROM payments WHERE id = $1", id).
		Scan(&p.ID, &p.OrderID, &p.PaymentMethod, &p.Status)
	if err != nil {
		return nil, err
	}
	return p, nil
}
""",
    "internal/usecase/order_usecase.go": """package usecase

import (
	"order-service/internal/domain"
	"github.com/nats-io/nats.go"
	"encoding/json"
	"errors"
)

type OrderUsecase struct {
	repo domain.OrderRepository
	nc   *nats.Conn
}

func NewOrderUsecase(repo domain.OrderRepository, nc *nats.Conn) *OrderUsecase {
	return &OrderUsecase{repo: repo, nc: nc}
}

func (u *OrderUsecase) CreateOrder(userID string, items []domain.OrderItem) (*domain.Order, error) {
	var total float64
	for _, item := range items {
		total += item.Price * float64(item.Quantity)
	}
	order := &domain.Order{
		UserID:      userID,
		Items:       items,
		TotalAmount: total,
		Status:      "CREATED",
	}
	if err := u.repo.CreateOrder(order); err != nil {
		return nil, err
	}
	
	eventData, _ := json.Marshal(map[string]interface{}{
		"order_id": order.ID, "user_id": userID, "total": total,
	})
	u.nc.Publish("order.created", eventData)
	return order, nil
}

func (u *OrderUsecase) GetOrderByID(id string) (*domain.Order, error) {
	return u.repo.GetOrderByID(id)
}

func (u *OrderUsecase) ListOrders(userID string, page, limit int) ([]*domain.Order, int, error) {
	return u.repo.ListOrders(userID, page, limit)
}

func (u *OrderUsecase) CancelOrder(id string) error {
	order, err := u.repo.GetOrderByID(id)
	if err != nil {
		return err
	}
	if order.Status == "COMPLETED" {
		return errors.New("cannot cancel completed order")
	}
	return u.repo.UpdateOrderStatus(id, "CANCELLED")
}

func (u *OrderUsecase) CreatePayment(orderID, method string) (*domain.Payment, error) {
	p := &domain.Payment{OrderID: orderID, PaymentMethod: method, Status: "PENDING"}
	if err := u.repo.CreatePayment(p); err != nil {
		return nil, err
	}
	// Simulate async payment processing
	go func() {
		u.repo.UpdateOrderStatus(orderID, "PAID")
		eventData, _ := json.Marshal(map[string]string{"order_id": orderID, "status": "PAID"})
		u.nc.Publish("order.paid", eventData)
	}()
	return p, nil
}

func (u *OrderUsecase) GetPaymentStatus(paymentID string) (string, error) {
	p, err := u.repo.GetPayment(paymentID)
	if err != nil {
		return "", err
	}
	return p.Status, nil
}

func (u *OrderUsecase) UpdateOrderStatus(orderID, status string) error {
	return u.repo.UpdateOrderStatus(orderID, status)
}

func (u *OrderUsecase) TrackOrder(orderID string) (string, error) {
	order, err := u.repo.GetOrderByID(orderID)
	if err != nil {
		return "", err
	}
	return "Current status: " + order.Status, nil
}

func (u *OrderUsecase) ApplyDiscount(orderID, discountCode string) (*domain.Order, float64, error) {
	order, err := u.repo.GetOrderByID(orderID)
	if err != nil {
		return nil, 0, err
	}
	// Dummy 10% discount
	newTotal := order.TotalAmount * 0.9
	order.TotalAmount = newTotal
	return order, newTotal, nil
}

func (u *OrderUsecase) CalculateTotal(items []domain.OrderItem, discountCode string) float64 {
	var total float64
	for _, item := range items {
		total += item.Price * float64(item.Quantity)
	}
	if discountCode != "" {
		total *= 0.9
	}
	return total
}

func (u *OrderUsecase) AddItemToOrder(orderID string, item domain.OrderItem) (*domain.Order, error) {
	order, err := u.repo.GetOrderByID(orderID)
	if err != nil {
		return nil, err
	}
	order.Items = append(order.Items, item)
	order.TotalAmount += item.Price * float64(item.Quantity)
	// Update not implemented in repo for simplicity, imagine it's here
	return order, nil
}

func (u *OrderUsecase) RemoveItemFromOrder(orderID, productID string) (*domain.Order, error) {
	order, err := u.repo.GetOrderByID(orderID)
	if err != nil {
		return nil, err
	}
	var newItems []domain.OrderItem
	for _, it := range order.Items {
		if it.ProductID != productID {
			newItems = append(newItems, it)
		} else {
			order.TotalAmount -= it.Price * float64(it.Quantity)
		}
	}
	order.Items = newItems
	return order, nil
}
""",
    "internal/delivery/grpc/handler.go": """package grpc

import (
	"context"
	pb "online-shop/pb"
	"order-service/internal/usecase"
	"order-service/internal/domain"
	"time"
)

type OrderHandler struct {
	pb.UnimplementedOrderServiceServer
	usecase *usecase.OrderUsecase
}

func NewOrderHandler(usecase *usecase.OrderUsecase) *OrderHandler {
	return &OrderHandler{usecase: usecase}
}

func mapOrderToPB(o *domain.Order) *pb.Order {
	var items []*pb.OrderItem
	for _, it := range o.Items {
		items = append(items, &pb.OrderItem{ProductId: it.ProductID, Quantity: int32(it.Quantity), Price: it.Price})
	}
	return &pb.Order{
		Id: o.ID, UserId: o.UserID, Items: items, TotalAmount: o.TotalAmount, Status: o.Status, CreatedAt: o.CreatedAt.Format(time.RFC3339),
	}
}

func (h *OrderHandler) CreateOrder(ctx context.Context, req *pb.CreateOrderRequest) (*pb.CreateOrderResponse, error) {
	var items []domain.OrderItem
	for _, it := range req.Items {
		items = append(items, domain.OrderItem{ProductID: it.ProductId, Quantity: int(it.Quantity), Price: it.Price})
	}
	o, err := h.usecase.CreateOrder(req.UserId, items)
	if err != nil {
		return nil, err
	}
	return &pb.CreateOrderResponse{Order: mapOrderToPB(o)}, nil
}

func (h *OrderHandler) GetOrderByID(ctx context.Context, req *pb.GetOrderByIDRequest) (*pb.GetOrderByIDResponse, error) {
	o, err := h.usecase.GetOrderByID(req.Id)
	if err != nil {
		return nil, err
	}
	return &pb.GetOrderByIDResponse{Order: mapOrderToPB(o)}, nil
}

func (h *OrderHandler) ListOrders(ctx context.Context, req *pb.ListOrdersRequest) (*pb.ListOrdersResponse, error) {
	orders, total, err := h.usecase.ListOrders(req.UserId, int(req.Page), int(req.Limit))
	if err != nil {
		return nil, err
	}
	var pbOrders []*pb.Order
	for _, o := range orders {
		pbOrders = append(pbOrders, mapOrderToPB(o))
	}
	return &pb.ListOrdersResponse{Orders: pbOrders, Total: int32(total)}, nil
}

func (h *OrderHandler) CancelOrder(ctx context.Context, req *pb.CancelOrderRequest) (*pb.CancelOrderResponse, error) {
	err := h.usecase.CancelOrder(req.Id)
	return &pb.CancelOrderResponse{Success: err == nil}, err
}

func (h *OrderHandler) CreatePayment(ctx context.Context, req *pb.CreatePaymentRequest) (*pb.CreatePaymentResponse, error) {
	p, err := h.usecase.CreatePayment(req.OrderId, req.PaymentMethod)
	if err != nil {
		return nil, err
	}
	return &pb.CreatePaymentResponse{PaymentId: p.ID, Status: p.Status}, nil
}

func (h *OrderHandler) GetPaymentStatus(ctx context.Context, req *pb.GetPaymentStatusRequest) (*pb.GetPaymentStatusResponse, error) {
	status, err := h.usecase.GetPaymentStatus(req.PaymentId)
	if err != nil {
		return nil, err
	}
	return &pb.GetPaymentStatusResponse{Status: status}, nil
}

func (h *OrderHandler) UpdateOrderStatus(ctx context.Context, req *pb.UpdateOrderStatusRequest) (*pb.UpdateOrderStatusResponse, error) {
	err := h.usecase.UpdateOrderStatus(req.OrderId, req.Status)
	return &pb.UpdateOrderStatusResponse{Success: err == nil}, err
}

func (h *OrderHandler) TrackOrder(ctx context.Context, req *pb.TrackOrderRequest) (*pb.TrackOrderResponse, error) {
	info, err := h.usecase.TrackOrder(req.OrderId)
	if err != nil {
		return nil, err
	}
	return &pb.TrackOrderResponse{TrackingInfo: info}, nil
}

func (h *OrderHandler) ApplyDiscount(ctx context.Context, req *pb.ApplyDiscountRequest) (*pb.ApplyDiscountResponse, error) {
	o, newTotal, err := h.usecase.ApplyDiscount(req.OrderId, req.DiscountCode)
	if err != nil {
		return nil, err
	}
	return &pb.ApplyDiscountResponse{Order: mapOrderToPB(o), NewTotal: newTotal}, nil
}

func (h *OrderHandler) CalculateTotal(ctx context.Context, req *pb.CalculateTotalRequest) (*pb.CalculateTotalResponse, error) {
	var items []domain.OrderItem
	for _, it := range req.Items {
		items = append(items, domain.OrderItem{ProductID: it.ProductId, Quantity: int(it.Quantity), Price: it.Price})
	}
	total := h.usecase.CalculateTotal(items, req.DiscountCode)
	return &pb.CalculateTotalResponse{TotalAmount: total}, nil
}

func (h *OrderHandler) AddItemToOrder(ctx context.Context, req *pb.AddItemToOrderRequest) (*pb.AddItemToOrderResponse, error) {
	item := domain.OrderItem{ProductID: req.Item.ProductId, Quantity: int(req.Item.Quantity), Price: req.Item.Price}
	o, err := h.usecase.AddItemToOrder(req.OrderId, item)
	if err != nil {
		return nil, err
	}
	return &pb.AddItemToOrderResponse{Order: mapOrderToPB(o)}, nil
}

func (h *OrderHandler) RemoveItemFromOrder(ctx context.Context, req *pb.RemoveItemFromOrderRequest) (*pb.RemoveItemFromOrderResponse, error) {
	o, err := h.usecase.RemoveItemFromOrder(req.OrderId, req.ProductId)
	if err != nil {
		return nil, err
	}
	return &pb.RemoveItemFromOrderResponse{Order: mapOrderToPB(o)}, nil
}
"""
}

for path, content in files.items():
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
print("Order Service Generated")
