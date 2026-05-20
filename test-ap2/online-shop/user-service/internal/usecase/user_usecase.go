package usecase

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"time"
	"user-service/internal/domain"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/nats-io/nats.go"
	"golang.org/x/crypto/bcrypt"
)

type UserUsecase struct {
	repo  domain.UserRepository
	cache domain.UserCacheRepository
	nc    *nats.Conn
	js    nats.JetStreamContext
	jq    *JobQueue
	email *EmailService
}

func NewUserUsecase(repo domain.UserRepository, cache domain.UserCacheRepository, nc *nats.Conn, email *EmailService) *UserUsecase {
	u := &UserUsecase{repo: repo, cache: cache, nc: nc, email: email}

	if nc != nil {
		js, err := nc.JetStream()
		if err != nil {
			log.Printf("[UserUsecase] WARNING: JetStream not available for publishing: %v", err)
		} else {
			u.js = js
		}
	}

	return u
}

func (u *UserUsecase) SetJobQueue(jq *JobQueue) {
	u.jq = jq
}

func (u *UserUsecase) publishEvent(subject string, payload interface{}) {
	data, err := json.Marshal(payload)
	if err != nil {
		log.Printf("[UserUsecase] Failed to marshal event: %v", err)
		return
	}

	job := &Job{
		ID:        fmt.Sprintf("%s-%d", subject, time.Now().UnixNano()),
		Subject:   subject,
		Payload:   data,
		Status:    JobStatusPending,
		Attempt:   0,
		MaxRetry:  5,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Metadata:  map[string]string{},
	}
	envelope, _ := json.Marshal(job)

	if u.js != nil {
		_, err := u.js.Publish(subject, envelope)
		if err != nil {
			log.Printf("[UserUsecase] JetStream publish failed for %s, falling back to core NATS: %v", subject, err)
			u.nc.Publish(subject, data)
		} else {
			log.Printf("[UserUsecase] Published event via JetStream: %s", subject)
		}
		return
	}

	if u.nc != nil {
		u.nc.Publish(subject, data)
	}
}

func (u *UserUsecase) Register(email, password, name string) (*domain.User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	user := &domain.User{
		Email:      email,
		Password:   string(hashedPassword),
		Name:       name,
		IsVerified: false,
	}
	if err := u.repo.Create(user); err != nil {
		return nil, err
	}

	tokenUUID := uuid.New().String()
	err = u.cache.SetSession(user.ID, "verify:"+tokenUUID, 24*time.Hour)
	if err != nil {
		log.Printf("[UserUsecase] Failed to store verification token in Redis: %v", err)
	}

	u.publishEvent("user.created", map[string]string{"email": user.Email, "id": user.ID})

	if u.email != nil {
		u.email.SendVerificationEmail(user.Email, tokenUUID)
	}

	return user, nil
}

func (u *UserUsecase) Login(email, password string) (string, string, *domain.User, error) {
	user, err := u.repo.GetByEmail(email)
	if err != nil {
		return "", "", nil, errors.New("invalid credentials")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", "", nil, errors.New("invalid credentials")
	}
	role := "user"
	if user.Email == "admin@gmail.com" {
		role = "admin"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "fallback-dev-only-secret"
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":   user.ID,
		"role": role,
		"exp":  time.Now().Add(time.Hour * 24).Unix(),
	})
	accessTokenString, err := accessToken.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", "", nil, err
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":   user.ID,
		"role": role,
		"exp":  time.Now().Add(time.Hour * 24 * 7).Unix(),
	})
	refreshTokenString, err := refreshToken.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", "", nil, err
	}

	if err := u.cache.SetSession(user.ID, accessTokenString, 24*time.Hour); err != nil {
		return "", "", nil, err
	}

	if err := u.cache.SetSession(user.ID, refreshTokenString, 7*24*time.Hour); err != nil {
		return "", "", nil, err
	}

	return accessTokenString, refreshTokenString, user, nil
}

func (u *UserUsecase) GetByID(id string) (*domain.User, error) {
	return u.repo.GetByID(id)
}

func (u *UserUsecase) Update(id, name string) (*domain.User, error) {
	user, err := u.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	user.Name = name
	if err := u.repo.Update(user); err != nil {
		return nil, err
	}
	return user, nil
}

func (u *UserUsecase) Delete(id string) error {
	return u.repo.Delete(id)
}

func (u *UserUsecase) VerifyEmail(token string) error {
	userID, err := u.cache.GetSession("verify:" + token)
	if err != nil || userID == "" {
		return errors.New("invalid or expired verification token")
	}

	if err := u.repo.SetVerified(userID); err != nil {
		return err
	}

	_ = u.cache.DeleteSession("verify:" + token)
	return nil
}

func (u *UserUsecase) ChangePassword(id, oldPassword, newPassword string) error {
	user, err := u.repo.GetByID(id)
	if err != nil {
		return err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(oldPassword)); err != nil {
		return errors.New("invalid old password")
	}
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	user.Password = string(hashedPassword)
	return u.repo.Update(user)
}

func (u *UserUsecase) List(page, limit int) ([]*domain.User, int, error) {
	return u.repo.List(page, limit)
}

func (u *UserUsecase) Logout(token string) error {
	return u.cache.DeleteSession(token)
}

func (u *UserUsecase) RefreshToken(oldRefreshToken string) (string, error) {
	userID, err := u.cache.GetSession(oldRefreshToken)
	if err != nil || userID == "" {
		return "", errors.New("unauthenticated")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "fallback-dev-only-secret"
	}

	token, err := jwt.Parse(oldRefreshToken, func(token *jwt.Token) (interface{}, error) {
		return []byte(jwtSecret), nil
	})
	if err != nil || !token.Valid {
		return "", errors.New("unauthenticated")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("unauthenticated")
	}

	role, _ := claims["role"].(string)
	if role == "" {
		role = "user"
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":   userID,
		"role": role,
		"exp":  time.Now().Add(time.Hour * 24).Unix(),
	})
	newAccessTokenString, err := accessToken.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", err
	}

	newRefreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":   userID,
		"role": role,
		"exp":  time.Now().Add(time.Hour * 24 * 7).Unix(),
	})
	newRefreshTokenString, err := newRefreshToken.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", err
	}

	_ = u.cache.DeleteSession(oldRefreshToken)
	_ = u.cache.SetSession(userID, newAccessTokenString, 24*time.Hour)
	_ = u.cache.SetSession(userID, newRefreshTokenString, 7*24*time.Hour)

	return newAccessTokenString, nil
}
