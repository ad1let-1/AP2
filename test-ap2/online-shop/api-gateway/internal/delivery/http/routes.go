package http

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

		products.POST("/categories", func(c *gin.Context) {
			var req pb.CreateCategoryRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			res, err := productClient.CreateCategory(context.Background(), &req)
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
