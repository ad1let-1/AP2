package domain

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
