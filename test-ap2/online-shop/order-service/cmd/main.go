package main

import (
	"database/sql"
	"log"
	"net"
	"os"

	deliveryGrpc "order-service/internal/delivery/grpc"
	"order-service/internal/repository"
	"order-service/internal/usecase"
	pb "online-shop/pb"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/nats-io/nats.go"
	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc"
	_ "github.com/lib/pq"
)

func main() {
	dbConn := os.Getenv("DATABASE_URL")
	if dbConn == "" {
		dbConn = "postgres://postgres:bekarys7@localhost:5432/online_shop?sslmode=disable"
	}
	db, err := sql.Open("postgres", dbConn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Run Database Migrations
	migrationPath := "file://migrations"
	if _, err := os.Stat("migrations"); os.IsNotExist(err) {
		migrationPath = "file:///migrations"
	}
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		log.Fatalf("Could not create postgres driver for migrations: %v", err)
	}
	m, err := migrate.NewWithDatabaseInstance(migrationPath, "postgres", driver)
	if err != nil {
		log.Fatalf("Migration init failed: %v", err)
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatalf("Migration up failed: %v", err)
	}
	log.Println("Database migrations applied successfully!")

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

	orderRepo := repository.NewPostgresOrderRepository(db)
	orderCache := repository.NewRedisOrderCacheRepository(rdb)
	orderUsecase := usecase.NewOrderUsecase(orderRepo, orderCache, nc)
	orderHandler := deliveryGrpc.NewOrderHandler(orderUsecase)

	// Initialize JetStream job queue with retry for subscribers
	jq := usecase.RegisterOrderSubscribers(nc, orderUsecase)
	if jq != nil {
		orderUsecase.SetJobQueue(jq)
		defer jq.Shutdown()
		log.Println("[Main] JetStream job queue with retry initialized for Order Service")
	}

	lis, err := net.Listen("tcp", ":50053")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterOrderServiceServer(grpcServer, orderHandler)

	log.Println("Order Service is running on port 50053...")
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
