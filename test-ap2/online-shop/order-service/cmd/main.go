package main

import (
	"log"
	"net"
	"os"

	deliveryGrpc "order-service/internal/delivery/grpc"
	"order-service/internal/repository"
	"order-service/internal/usecase"
	pb "online-shop/pb"

	"github.com/nats-io/nats.go"
	"google.golang.org/grpc"
	"database/sql"
	_ "github.com/lib/pq"
)

func main() {
	dbConn := os.Getenv("DATABASE_URL")
	if dbConn == "" {
		dbConn = "postgres://postgres:bekarys7@localhost:5432/orderdb?sslmode=disable"
	}
	db, err := sql.Open("postgres", dbConn)
	if err != nil {
		log.Fatal(err)
	}

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
	orderUsecase := usecase.NewOrderUsecase(orderRepo, nc)
	orderHandler := deliveryGrpc.NewOrderHandler(orderUsecase)
	usecase.RegisterOrderSubscribers(nc, orderUsecase)

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

