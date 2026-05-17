package main

import (
	"log"
	"net"
	"os"

	deliveryGrpc "user-service/internal/delivery/grpc"
	"user-service/internal/repository"
	"user-service/internal/usecase"
	pb "online-shop/pb"

	"github.com/nats-io/nats.go"
	"google.golang.org/grpc"
	"database/sql"
	_ "github.com/lib/pq"
)

func main() {
	dbConn := os.Getenv("DATABASE_URL")
	if dbConn == "" {
		dbConn = "postgres://postgres:bekarys7@localhost:5432/userdb?sslmode=disable"
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

	userRepo := repository.NewPostgresUserRepository(db)
	userUsecase := usecase.NewUserUsecase(userRepo, nc)
	userHandler := deliveryGrpc.NewUserHandler(userUsecase)
	emailService := usecase.NewEmailService()
	usecase.RegisterUserSubscribers(nc, emailService)

	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterUserServiceServer(grpcServer, userHandler)

	log.Println("User Service is running on port 50051...")
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}

