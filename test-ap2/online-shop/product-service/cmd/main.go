package main

import (
	"log"
	"net"
	"os"

	deliveryGrpc "product-service/internal/delivery/grpc"
	"product-service/internal/repository"
	"product-service/internal/usecase"
	pb "online-shop/pb"

	"github.com/nats-io/nats.go"
	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc"
	"database/sql"
	_ "github.com/lib/pq"
)

func main() {
	dbConn := os.Getenv("DATABASE_URL")
	if dbConn == "" {
		dbConn = "postgres://postgres:bekarys7@localhost:5432/productdb?sslmode=disable"
	}
	db, err := sql.Open("postgres", dbConn)
	if err != nil {
		log.Fatal(err)
	}

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}
	rdb := redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})

	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = nats.DefaultURL
	}
	nc, err := nats.Connect(natsURL)
	if err != nil {
		log.Fatal(err)
	}
	defer nc.Close()

	productRepo := repository.NewPostgresProductRepository(db)
	cacheRepo := repository.NewRedisCacheRepository(rdb)
	productUsecase := usecase.NewProductUsecase(productRepo, cacheRepo, nc)
	productHandler := deliveryGrpc.NewProductHandler(productUsecase)
	usecase.RegisterProductSubscribers(nc, productUsecase)

	lis, err := net.Listen("tcp", ":50052")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterProductServiceServer(grpcServer, productHandler)

	log.Println("Product Service is running on port 50052...")
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}

