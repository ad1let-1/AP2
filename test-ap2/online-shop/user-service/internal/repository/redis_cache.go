package repository

import (
	"context"
	"time"
	"user-service/internal/domain"
	"github.com/redis/go-redis/v9"
)

type redisUserCacheRepository struct {
	client *redis.Client
}

func NewRedisUserCacheRepository(client *redis.Client) domain.UserCacheRepository {
	return &redisUserCacheRepository{client: client}
}

func (r *redisUserCacheRepository) SetSession(userID, token string, ttl time.Duration) error {
	return r.client.Set(context.Background(), token, userID, ttl).Err()
}

func (r *redisUserCacheRepository) GetSession(token string) (string, error) {
	return r.client.Get(context.Background(), token).Result()
}

func (r *redisUserCacheRepository) DeleteSession(token string) error {
	return r.client.Del(context.Background(), token).Err()
}
