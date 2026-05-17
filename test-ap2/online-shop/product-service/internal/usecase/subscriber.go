package usecase

import (
	"encoding/json"
	"log"
	"github.com/nats-io/nats.go"
)

func RegisterProductSubscribers(nc *nats.Conn, u *ProductUsecase) {
	nc.Subscribe("order.created", func(m *nats.Msg) {
		var data map[string]interface{}
		json.Unmarshal(m.Data, &data)
		orderID := data["order_id"].(string)
		log.Printf("Event order.created received. Deducting stock for order %s", orderID)
		// For a real implementation, we'd deduct the actual items. Here we simulate it.
	})
}
