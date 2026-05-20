package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/nats-io/nats.go"
)

type OrderItemPayload struct {
	ProductID string `json:"product_id"`
	Quantity  int    `json:"quantity"`
}

type OrderCreatedPayload struct {
	OrderID string             `json:"order_id"`
	UserID  string             `json:"user_id"`
	Items   []OrderItemPayload `json:"items"`
}

// RegisterProductSubscribers sets up JetStream-backed job queue subscribers
// with exponential backoff retry and dead-letter queue for the product service.
func RegisterProductSubscribers(nc *nats.Conn, u *ProductUsecase) *JobQueue {
	jq, err := NewJobQueue(nc, JobQueueConfig{
		StreamName: "PRODUCT_EVENTS",
		Subjects:   []string{"order.created"},
		RetryPolicy: RetryPolicy{
			MaxRetries:    5,
			InitialDelay:  1_000_000_000,  // 1s
			MaxDelay:      60_000_000_000, // 60s
			BackoffFactor: 2.0,
			JitterPercent: 10,
		},
	})
	if err != nil {
		log.Printf("[ProductSubscriber] WARNING: Failed to create JetStream job queue: %v. Falling back to core NATS.", err)
		registerLegacyProductSubscribers(nc, u)
		return nil
	}

	// Register handler for order.created events — deduct stock
	jq.RegisterHandler("order.created", func(ctx context.Context, job *Job) error {
		var payload OrderCreatedPayload
		if err := json.Unmarshal(job.Payload, &payload); err != nil {
			return fmt.Errorf("failed to unmarshal order.created payload: %w", err)
		}

		if payload.OrderID == "" {
			return fmt.Errorf("missing order_id in order.created event")
		}

		log.Printf("[ProductSubscriber] Processing order.created event: order_id=%s attempt=%d",
			payload.OrderID, job.Attempt)

		for _, item := range payload.Items {
			if item.ProductID == "" || item.Quantity <= 0 {
				log.Printf("[ProductSubscriber] Invalid item productID=%s quantity=%d, skipping", item.ProductID, item.Quantity)
				continue
			}
			err := u.UpdateStock(item.ProductID, -item.Quantity)
			if err != nil {
				log.Printf("[ProductSubscriber] ❌ Failed to deduct stock for product %s (qty: %d): %v", item.ProductID, item.Quantity, err)
				return fmt.Errorf("failed to deduct stock for product %s: %w", item.ProductID, err)
			}
			log.Printf("[ProductSubscriber] ✅ Stock deducted for product %s (qty: %d)", item.ProductID, item.Quantity)
		}

		log.Printf("[ProductSubscriber] ✅ Stock deduction processed successfully for order %s", payload.OrderID)
		return nil
	})

	// Subscribe to order.created with retry
	if err := jq.Subscribe("order.created"); err != nil {
		log.Printf("[ProductSubscriber] Failed to subscribe to order.created via JetStream: %v", err)
	}

	log.Println("[ProductSubscriber] JetStream job queue initialized with retry policy (maxRetries=5, backoff=2x)")
	return jq
}

// registerLegacyProductSubscribers falls back to core NATS if JetStream is unavailable.
func registerLegacyProductSubscribers(nc *nats.Conn, u *ProductUsecase) {
	nc.Subscribe("order.created", func(m *nats.Msg) {
		var payload OrderCreatedPayload
		if err := json.Unmarshal(m.Data, &payload); err != nil {
			log.Printf("[ProductSubscriber-Legacy] Failed to unmarshal: %v", err)
			return
		}
		log.Printf("[ProductSubscriber-Legacy] Event order.created received. Deducting stock for order %s", payload.OrderID)
		for _, item := range payload.Items {
			if item.ProductID == "" || item.Quantity <= 0 {
				continue
			}
			err := u.UpdateStock(item.ProductID, -item.Quantity)
			if err != nil {
				log.Printf("[ProductSubscriber-Legacy] Failed to deduct stock for product %s: %v", item.ProductID, err)
			} else {
				log.Printf("[ProductSubscriber-Legacy] Stock deducted for product %s (qty: %d)", item.ProductID, item.Quantity)
			}
		}
	})
}
