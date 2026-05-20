package repository

import (
	"context"
	"encoding/json"
	"time"
	"order-service/internal/domain"
	"github.com/redis/go-redis/v9"
)

type redisOrderCacheRepository struct {
	client *redis.Client
}

func NewRedisOrderCacheRepository(client *redis.Client) domain.OrderCacheRepository {
	return &redisOrderCacheRepository{client: client}
}

func (r *redisOrderCacheRepository) SetOrder(o *domain.Order) error {
	data, err := json.Marshal(o)
	if err != nil {
		return err
	}
	return r.client.Set(context.Background(), "order:"+o.ID, data, 5*time.Minute).Err()
}

func (r *redisOrderCacheRepository) GetOrder(id string) (*domain.Order, error) {
	data, err := r.client.Get(context.Background(), "order:"+id).Bytes()
	if err != nil {
		return nil, err
	}
	o := &domain.Order{}
	if err := json.Unmarshal(data, o); err != nil {
		return nil, err
	}
	return o, nil
}

func (r *redisOrderCacheRepository) InvalidateOrder(id string) error {
	return r.client.Del(context.Background(), "order:"+id).Err()
}
