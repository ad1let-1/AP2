package usecase

import (
	"encoding/json"
	"log"
	"github.com/nats-io/nats.go"
)

func RegisterOrderSubscribers(nc *nats.Conn, u *OrderUsecase) {
	nc.Subscribe("order.paid", func(m *nats.Msg) {
		var data map[string]string
		json.Unmarshal(m.Data, &data)
		orderID := data["order_id"]
		status := data["status"]
		log.Printf("Event order.paid received for %s, status: %s", orderID, status)
		// Usually we'd update some internal metrics or trigger shipment
	})
}
