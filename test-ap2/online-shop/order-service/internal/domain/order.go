package domain

import "time"

type OrderItem struct {
	ProductID string  `json:"product_id"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
}

type Order struct {
	ID          string      `json:"id"`
	UserID      string      `json:"user_id"`
	Items       []OrderItem `json:"items"`
	TotalAmount float64     `json:"total_amount"`
	Status      string      `json:"status"`
	CreatedAt   time.Time   `json:"created_at"`
}

type Payment struct {
	ID            string `json:"id"`
	OrderID       string `json:"order_id"`
	PaymentMethod string `json:"payment_method"`
	Status        string `json:"status"`
}

type OrderRepository interface {
	CreateOrder(o *Order) error
	GetOrderByID(id string) (*Order, error)
	ListOrders(userID string, page, limit int) ([]*Order, int, error)
	UpdateOrderStatus(id, status string) error
	UpdateOrder(o *Order) error
	
	CreatePayment(p *Payment) error
	GetPayment(id string) (*Payment, error)
}

type OrderCacheRepository interface {
	SetOrder(o *Order) error
	GetOrder(id string) (*Order, error)
	InvalidateOrder(id string) error
}
