package usecase

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"order-service/internal/domain"
	"time"

	"github.com/nats-io/nats.go"
)

type OrderUsecase struct {
	repo  domain.OrderRepository
	cache domain.OrderCacheRepository
	nc    *nats.Conn
	js    nats.JetStreamContext // JetStream context for reliable publishing
	jq    *JobQueue             // Reference to job queue for stats
}

func NewOrderUsecase(repo domain.OrderRepository, cache domain.OrderCacheRepository, nc *nats.Conn) *OrderUsecase {
	u := &OrderUsecase{repo: repo, cache: cache, nc: nc}

	// Try to create JetStream context for publishing
	if nc != nil {
		js, err := nc.JetStream()
		if err != nil {
			log.Printf("[OrderUsecase] WARNING: JetStream not available for publishing: %v", err)
		} else {
			u.js = js
		}
	}

	return u
}

// SetJobQueue sets the job queue reference (called from main after initialization).
func (u *OrderUsecase) SetJobQueue(jq *JobQueue) {
	u.jq = jq
}

// publishEvent publishes an event via JetStream (reliable) or falls back to core NATS.
func (u *OrderUsecase) publishEvent(subject string, payload interface{}) {
	data, err := json.Marshal(payload)
	if err != nil {
		log.Printf("[OrderUsecase] Failed to marshal event: %v", err)
		return
	}

	// Wrap in Job envelope for JetStream consumers
	job := &Job{
		ID:        fmt.Sprintf("%s-%d", subject, time.Now().UnixNano()),
		Subject:   subject,
		Payload:   data,
		Status:    JobStatusPending,
		Attempt:   0,
		MaxRetry:  5,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Metadata:  map[string]string{},
	}
	envelope, _ := json.Marshal(job)

	if u.js != nil {
		_, err := u.js.Publish(subject, envelope)
		if err != nil {
			log.Printf("[OrderUsecase] JetStream publish failed for %s, falling back to core NATS: %v", subject, err)
			u.nc.Publish(subject, data)
		} else {
			log.Printf("[OrderUsecase] Published event via JetStream: %s", subject)
		}
		return
	}

	if u.nc != nil {
		u.nc.Publish(subject, data)
	}
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

	// Publish full items list so subscriber can deduct stock properly
	u.publishEvent("order.created", map[string]interface{}{
		"order_id": order.ID,
		"user_id":  userID,
		"items":    items,
	})

	_ = u.cache.SetOrder(order)
	return order, nil
}

func (u *OrderUsecase) GetOrderByID(id string) (*domain.Order, error) {
	order, err := u.cache.GetOrder(id)
	if err == nil && order != nil {
		return order, nil
	}

	order, err = u.repo.GetOrderByID(id)
	if err != nil {
		return nil, err
	}

	_ = u.cache.SetOrder(order)
	return order, nil
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
	if err := u.repo.UpdateOrderStatus(id, "CANCELLED"); err != nil {
		return err
	}
	_ = u.cache.InvalidateOrder(id)
	return nil
}

func (u *OrderUsecase) CreatePayment(orderID, method string) (*domain.Payment, error) {
	p := &domain.Payment{OrderID: orderID, PaymentMethod: method, Status: "COMPLETED"}
	if err := u.repo.CreatePayment(p); err != nil {
		return nil, err
	}
	if err := u.repo.UpdateOrderStatus(orderID, "PAID"); err != nil {
		return nil, err
	}
	_ = u.cache.InvalidateOrder(orderID)

	if u.nc != nil {
		eventData, _ := json.Marshal(map[string]string{"order_id": orderID, "status": "PAID"})
		u.publishEvent("order.paid", eventData)
	}
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
	if err := u.repo.UpdateOrderStatus(orderID, status); err != nil {
		return err
	}
	_ = u.cache.InvalidateOrder(orderID)
	return nil
}

func (u *OrderUsecase) TrackOrder(orderID string) (string, error) {
	order, err := u.GetOrderByID(orderID)
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
	newTotal := order.TotalAmount * 0.9
	order.TotalAmount = newTotal
	if err := u.repo.UpdateOrder(order); err != nil {
		return nil, 0, err
	}
	_ = u.cache.InvalidateOrder(orderID)
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
	if err := u.repo.UpdateOrder(order); err != nil {
		return nil, err
	}
	_ = u.cache.InvalidateOrder(orderID)
	return order, nil
}

func (u *OrderUsecase) RemoveItemFromOrder(orderID, productID string) (*domain.Order, error) {
	order, err := u.repo.GetOrderByID(orderID)
	if err != nil {
		return nil, err
	}
	var newItems []domain.OrderItem
	found := false
	for _, it := range order.Items {
		if it.ProductID != productID {
			newItems = append(newItems, it)
		} else {
			order.TotalAmount -= it.Price * float64(it.Quantity)
			found = true
		}
	}
	if !found {
		return nil, errors.New("item not found in order")
	}
	order.Items = newItems
	if err := u.repo.UpdateOrder(order); err != nil {
		return nil, err
	}
	_ = u.cache.InvalidateOrder(orderID)
	return order, nil
}
