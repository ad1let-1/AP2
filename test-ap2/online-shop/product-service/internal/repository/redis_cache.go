package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"product-service/internal/domain"
	"github.com/redis/go-redis/v9"
	"time"
)

type redisCacheRepository struct {
	client *redis.Client
	ctx    context.Context
}

func NewRedisCacheRepository(client *redis.Client) domain.CacheRepository {
	return &redisCacheRepository{client: client, ctx: context.Background()}
}

func (r *redisCacheRepository) SetProduct(p *domain.Product) error {
	data, _ := json.Marshal(p)
	return r.client.Set(r.ctx, "product:"+p.ID, data, time.Minute*10).Err()
}

func (r *redisCacheRepository) GetProduct(id string) (*domain.Product, error) {
	data, err := r.client.Get(r.ctx, "product:"+id).Bytes()
	if err != nil {
		return nil, err
	}
	p := &domain.Product{}
	err = json.Unmarshal(data, p)
	return p, err
}

func (r *redisCacheRepository) InvalidateProduct(id string) error {
	return r.client.Del(r.ctx, "product:"+id).Err()
}

func (r *redisCacheRepository) SetProductList(page, limit int, products []*domain.Product) error {
	data, _ := json.Marshal(products)
	key := fmt.Sprintf("products:page:%d:limit:%d", page, limit)
	return r.client.Set(r.ctx, key, data, time.Minute*5).Err()
}

func (r *redisCacheRepository) GetProductList(page, limit int) ([]*domain.Product, error) {
	key := fmt.Sprintf("products:page:%d:limit:%d", page, limit)
	data, err := r.client.Get(r.ctx, key).Bytes()
	if err != nil {
		return nil, err
	}
	var products []*domain.Product
	err = json.Unmarshal(data, &products)
	return products, err
}

func (r *redisCacheRepository) InvalidateProductList() error {
	keys, err := r.client.Keys(r.ctx, "products:page:*").Result()
	if err != nil {
		return err
	}
	for _, key := range keys {
		r.client.Del(r.ctx, key)
	}
	return nil
}
