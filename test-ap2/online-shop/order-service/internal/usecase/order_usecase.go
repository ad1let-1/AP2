package usecase

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
