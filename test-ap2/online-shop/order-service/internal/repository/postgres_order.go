package repository

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
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	o.ID = uuid.New().String()
	o.CreatedAt = time.Now()
	itemsJSON, _ := json.Marshal(o.Items)
	
	_, err = tx.Exec("INSERT INTO orders (id, user_id, items, total_amount, status, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
		o.ID, o.UserID, itemsJSON, o.TotalAmount, o.Status, o.CreatedAt)
	if err != nil {
		return err
	}

	return tx.Commit()
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
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	p.ID = uuid.New().String()
	_, err = tx.Exec("INSERT INTO payments (id, order_id, payment_method, status) VALUES ($1, $2, $3, $4)",
		p.ID, p.OrderID, p.PaymentMethod, p.Status)
	if err != nil {
		return err
	}

	return tx.Commit()
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
