package usecase

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
		log.Println("SMTP_USER is not set. Email sending will be skipped or simulated.")
	}
	auth := smtp.PlainAuth("", from, password, host)
	return &EmailService{auth: auth, from: from, host: host + ":587"}
}

func (e *EmailService) SendVerificationEmail(to, token string) {
	if e.from == "" {
		log.Printf("Simulating email to %s: Please verify using token %s\n", to, token)
		return
	}
	msg := []byte("Subject: Verify your email\r\n\r\n" + "Your verification token is: " + token)
	err := smtp.SendMail(e.host, e.auth, e.from, []string{to}, msg)
	if err != nil {
		log.Printf("Failed to send email to %s: %v", to, err)
	}
}
