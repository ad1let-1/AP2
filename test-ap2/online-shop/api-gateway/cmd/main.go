package main

import (
	"log"
	"os"

	"api-gateway/internal/delivery/http"
	"api-gateway/internal/middleware"
	pb "online-shop/pb"

	"github.com/gin-gonic/gin"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	userServiceURL := os.Getenv("USER_SERVICE_URL")
	if userServiceURL == "" {
		userServiceURL = "localhost:50051"
	}
	productServiceURL := os.Getenv("PRODUCT_SERVICE_URL")
	if productServiceURL == "" {
		productServiceURL = "localhost:50052"
	}
	orderServiceURL := os.Getenv("ORDER_SERVICE_URL")
	if orderServiceURL == "" {
		orderServiceURL = "localhost:50053"
	}

	userConn, err := grpc.Dial(userServiceURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatal(err)
	}
	defer userConn.Close()
	userClient := pb.NewUserServiceClient(userConn)

	productConn, err := grpc.Dial(productServiceURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatal(err)
	}
	defer productConn.Close()
	productClient := pb.NewProductServiceClient(productConn)

	orderConn, err := grpc.Dial(orderServiceURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatal(err)
	}
	defer orderConn.Close()
	orderClient := pb.NewOrderServiceClient(orderConn)

	r := gin.Default()
	r.Use(func(c *gin.Context) {
	c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
	c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	if c.Request.Method == "OPTIONS" {
		c.AbortWithStatus(204)
		return
	}
	c.Next()
})
	r.Use(middleware.Logger())
	r.Use(middleware.ErrorHandler())

	http.RegisterRoutes(r, userClient, productClient, orderClient)

	log.Println("API Gateway is running on port 8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}

