package usecase

import (
	"errors"
	"order-service/internal/domain"
	"testing"
)

// Мок OrderRepository
type mockOrderRepository struct {
	orders   map[string]*domain.Order
	payments map[string]*domain.Payment
}

func (m *mockOrderRepository) CreateOrder(o *domain.Order) error {
	o.ID = "order-123"
	m.orders[o.ID] = o
	return nil
}

func (m *mockOrderRepository) GetOrderByID(id string) (*domain.Order, error) {
	o, exists := m.orders[id]
	if !exists {
		return nil, errors.New("order not found")
	}
	return o, nil
}

func (m *mockOrderRepository) ListOrders(userID string, page, limit int) ([]*domain.Order, int, error) {
	return nil, 0, nil
}

func (m *mockOrderRepository) UpdateOrderStatus(id, status string) error {
	o, exists := m.orders[id]
	if !exists {
		return errors.New("order not found")
	}
	o.Status = status
	return nil
}

func (m *mockOrderRepository) CreatePayment(p *domain.Payment) error {
	p.ID = "payment-123"
	m.payments[p.ID] = p
	return nil
}

func (m *mockOrderRepository) GetPayment(id string) (*domain.Payment, error) {
	p, exists := m.payments[id]
	if !exists {
		return nil, errors.New("payment not found")
	}
	return p, nil
}

func TestCreateOrder(t *testing.T) {
	repo := &mockOrderRepository{
		orders:   make(map[string]*domain.Order),
		payments: make(map[string]*domain.Payment),
	}
	uc := NewOrderUsecase(repo, nil)

	items := []domain.OrderItem{
		{ProductID: "prod-1", Quantity: 2, Price: 15.0},
		{ProductID: "prod-2", Quantity: 1, Price: 20.0},
	}

	order, err := uc.CreateOrder("user-abc", items)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if order.UserID != "user-abc" {
		t.Errorf("Expected user ID 'user-abc', got %s", order.UserID)
	}

	// 2 * 15 + 1 * 20 = 50
	if order.TotalAmount != 50.0 {
		t.Errorf("Expected total amount to be 50.0, got %f", order.TotalAmount)
	}

	if order.Status != "CREATED" {
		t.Errorf("Expected order status 'CREATED', got %s", order.Status)
	}
}

func TestCancelOrder(t *testing.T) {
	repo := &mockOrderRepository{
		orders: map[string]*domain.Order{
			"order-1": {ID: "order-1", UserID: "user-abc", Status: "CREATED"},
			"order-2": {ID: "order-2", UserID: "user-abc", Status: "COMPLETED"},
		},
		payments: make(map[string]*domain.Payment),
	}
	uc := NewOrderUsecase(repo, nil)

	// Тест-кейс 1: Успешная отмена
	err := uc.CancelOrder("order-1")
	if err != nil {
		t.Fatalf("Expected no error on cancelling active order, got: %v", err)
	}

	order1, _ := repo.GetOrderByID("order-1")
	if order1.Status != "CANCELLED" {
		t.Errorf("Expected status to be 'CANCELLED', got %s", order1.Status)
	}

	// Тест-кейс 2: Отмена завершенного заказа (должна быть ошибка)
	err = uc.CancelOrder("order-2")
	if err == nil {
		t.Error("Expected error when cancelling completed order, got nil")
	}
}
