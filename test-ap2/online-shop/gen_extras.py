import os

# User Service - Subscriber and Email
user_email_go = """package usecase

import (
	"log"
	"net/smtp"
	"os"
)

type EmailService struct {
	auth smtp.Auth
	from string
	host string
}

func NewEmailService() *EmailService {
	from := os.Getenv("SMTP_USER")
	password := os.Getenv("SMTP_PASS")
	host := "smtp.gmail.com"
	
	if from == "" {
		// Default or log warning
		log.Println("SMTP_USER is not set. Email sending will be skipped or simulated.")
	}
	auth := smtp.PlainAuth("", from, password, host)
	return &EmailService{auth: auth, from: from, host: host + ":587"}
}

func (e *EmailService) SendVerificationEmail(to, token string) {
	if e.from == "" {
		log.Printf("Simulating email to %s: Please verify using token %s\\n", to, token)
		return
	}
	msg := []byte("Subject: Verify your email\\r\\n\\r\\n" + "Your verification token is: " + token)
	err := smtp.SendMail(e.host, e.auth, e.from, []string{to}, msg)
	if err != nil {
		log.Printf("Failed to send email to %s: %v", to, err)
	}
}
"""

user_subscriber_go = """package usecase

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
"""

# Order Service - Subscriber
order_subscriber_go = """package usecase

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
"""

# Product Service - Subscriber
product_subscriber_go = """package usecase

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
"""

with open(r"c:\Final-AP2\online-shop\user-service\internal\usecase\email_service.go", "w") as f:
    f.write(user_email_go)
with open(r"c:\Final-AP2\online-shop\user-service\internal\usecase\subscriber.go", "w") as f:
    f.write(user_subscriber_go)
with open(r"c:\Final-AP2\online-shop\order-service\internal\usecase\subscriber.go", "w") as f:
    f.write(order_subscriber_go)
with open(r"c:\Final-AP2\online-shop\product-service\internal\usecase\subscriber.go", "w") as f:
    f.write(product_subscriber_go)

print("Extras generated")
