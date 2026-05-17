package usecase

import (
	"encoding/json"
	"log"
	"github.com/nats-io/nats.go"
)

func RegisterUserSubscribers(nc *nats.Conn, emailService *EmailService) {
	nc.Subscribe("user.created", func(m *nats.Msg) {
		var data map[string]string
		json.Unmarshal(m.Data, &data)
		email := data["email"]
		id := data["id"]
		log.Printf("Event user.created received for %s (%s)", email, id)
		emailService.SendVerificationEmail(email, "dummy-token-"+id)
	})
}
