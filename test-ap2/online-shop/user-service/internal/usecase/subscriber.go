package usecase

import (
	"log"
	"github.com/nats-io/nats.go"
)

// RegisterUserSubscribers is now a stub because user-service verification email is sent directly inside Register
func RegisterUserSubscribers(nc *nats.Conn, emailService *EmailService) *JobQueue {
	log.Println("[UserSubscriber] No subscribers registered for User Service (local verification instead)")
	return nil
}
