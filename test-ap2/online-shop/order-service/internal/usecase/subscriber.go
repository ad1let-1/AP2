package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/nats-io/nats.go"
)

// RegisterOrderSubscribers sets up JetStream-backed job queue subscribers
// with exponential backoff retry and dead-letter queue for the order service.
func RegisterOrderSubscribers(nc *nats.Conn, u *OrderUsecase) *JobQueue {
	jq, err := NewJobQueue(nc, JobQueueConfig{
		StreamName: "ORDER_EVENTS",
		Subjects:   []string{"order.paid", "order.shipped", "order.cancelled"},
		RetryPolicy: RetryPolicy{
			MaxRetries:    5,
			InitialDelay:  1_000_000_000,  // 1s
			MaxDelay:      60_000_000_000, // 60s
			BackoffFactor: 2.0,
			JitterPercent: 10,
		},
	})
	if err != nil {
		log.Printf("[OrderSubscriber] WARNING: Failed to create JetStream job queue: %v. Falling back to core NATS.", err)
		registerLegacyOrderSubscribers(nc, u)
		return nil
	}

	// Register handler for order.paid events — update order status to SHIPPED
	jq.RegisterHandler("order.paid", func(ctx context.Context, job *Job) error {
		var data map[string]string
		if err := json.Unmarshal(job.Payload, &data); err != nil {
			return fmt.Errorf("failed to unmarshal order.paid payload: %w", err)
		}

		orderID := data["order_id"]
		status := data["status"]

		if orderID == "" {
			return fmt.Errorf("missing order_id in order.paid event")
		}

		log.Printf("[OrderSubscriber] Processing order.paid event: order_id=%s status=%s attempt=%d",
			orderID, status, job.Attempt)

		// Call UpdateOrderStatus to set status to SHIPPED to advance the order state
		if err := u.UpdateOrderStatus(orderID, "SHIPPED"); err != nil {
			return fmt.Errorf("failed to update order status to SHIPPED: %w", err)
		}

		log.Printf("[OrderSubscriber] ✅ Order %s marked as SHIPPED (advanced from PAID)", orderID)
		return nil
	})

	// Subscribe to order.paid with retry
	if err := jq.Subscribe("order.paid"); err != nil {
		log.Printf("[OrderSubscriber] Failed to subscribe to order.paid via JetStream: %v", err)
	}

	log.Println("[OrderSubscriber] JetStream job queue initialized with retry policy (maxRetries=5, backoff=2x)")
	return jq
}

// registerLegacyOrderSubscribers falls back to core NATS if JetStream is unavailable.
func registerLegacyOrderSubscribers(nc *nats.Conn, u *OrderUsecase) {
	nc.Subscribe("order.paid", func(m *nats.Msg) {
		var data map[string]string
		if err := json.Unmarshal(m.Data, &data); err != nil {
			log.Printf("[OrderSubscriber-Legacy] Failed to unmarshal: %v", err)
			return
		}
		orderID := data["order_id"]
		status := data["status"]
		log.Printf("[OrderSubscriber-Legacy] Event order.paid received for %s, status: %s. Updating status to SHIPPED.", orderID, status)
		if err := u.UpdateOrderStatus(orderID, "SHIPPED"); err != nil {
			log.Printf("[OrderSubscriber-Legacy] Failed to update status to SHIPPED: %v", err)
		}
	})
}
