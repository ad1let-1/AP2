import os

base_dir = r"c:\Final-AP2\online-shop\api-gateway"

files = {
    "go.mod": """module api-gateway

go 1.21

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/golang-jwt/jwt/v5 v5.2.0
	google.golang.org/grpc v1.60.1
	google.golang.org/protobuf v1.32.0
)
""",
    "cmd/main.go": """package main

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
	r.Use(middleware.Logger())
	r.Use(middleware.ErrorHandler())

	http.RegisterRoutes(r, userClient, productClient, orderClient)

	log.Println("API Gateway is running on port 8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
""",
    "internal/middleware/auth.go": """package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authorization header required"})
			return
		}
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization format"})
			return
		}
		
		tokenStr := parts[1]
		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			return []byte("secret"), nil
		})
		
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			return
		}
		
		c.Set("user_id", claims["id"])
		c.Next()
	}
}

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Implement basic logging
		c.Next()
	}
}

func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		if len(c.Errors) > 0 {
			c.JSON(-1, c.Errors)
		}
	}
}
""",
    "internal/delivery/http/routes.go": """package http

import (
	"github.com/gin-gonic/gin"
	pb "online-shop/pb"
	"api-gateway/internal/middleware"
	"context"
	"net/http"
	"strconv"
)

func RegisterRoutes(r *gin.Engine, userClient pb.UserServiceClient, productClient pb.ProductServiceClient, orderClient pb.OrderServiceClient) {
	api := r.Group("/api")

	// Users
	users := api.Group("/users")
	{
		users.POST("/register", func(c *gin.Context) {
			var req pb.RegisterUserRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			res, err := userClient.RegisterUser(context.Background(), &req)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})
		users.POST("/login", func(c *gin.Context) {
			var req pb.LoginUserRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			res, err := userClient.LoginUser(context.Background(), &req)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})
		
		users.Use(middleware.AuthMiddleware())
		users.GET("/me", func(c *gin.Context) {
			userID := c.GetString("user_id")
			res, err := userClient.GetMe(context.Background(), &pb.GetMeRequest{Id: userID})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})
	}

	// Products
	products := api.Group("/products")
	{
		products.GET("", func(c *gin.Context) {
			page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
			limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
			res, err := productClient.ListProducts(context.Background(), &pb.ListProductsRequest{Page: int32(page), Limit: int32(limit)})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})
		products.GET("/:id", func(c *gin.Context) {
			res, err := productClient.GetProductByID(context.Background(), &pb.GetProductByIDRequest{Id: c.Param("id")})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})
		
		products.Use(middleware.AuthMiddleware())
		products.POST("", func(c *gin.Context) {
			var req pb.CreateProductRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			res, err := productClient.CreateProduct(context.Background(), &req)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})
	}

	// Orders
	orders := api.Group("/orders")
	orders.Use(middleware.AuthMiddleware())
	{
		orders.POST("", func(c *gin.Context) {
			var req pb.CreateOrderRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			req.UserId = c.GetString("user_id")
			res, err := orderClient.CreateOrder(context.Background(), &req)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})
		orders.GET("/:id", func(c *gin.Context) {
			res, err := orderClient.GetOrderByID(context.Background(), &pb.GetOrderByIDRequest{Id: c.Param("id")})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})
	}
}
"""
}

for path, content in files.items():
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
print("API Gateway Generated")
