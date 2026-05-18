package http

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"api-gateway/internal/middleware"
	pb "online-shop/pb"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, userClient pb.UserServiceClient, productClient pb.ProductServiceClient, orderClient pb.OrderServiceClient) {
	api := r.Group("/api")

	// ─────────────────────────────────────────────────────────────
	// 1. USERS & AUTHENTICATION
	// ─────────────────────────────────────────────────────────────
	users := api.Group("/users")
	{
		// Public
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

		users.GET("/verify", func(c *gin.Context) {
			token := c.Query("token")
			if token == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "token query param is required"})
				return
			}
			res, err := userClient.VerifyEmail(context.Background(), &pb.VerifyEmailRequest{Token: token})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})

		users.POST("/resend-verification", func(c *gin.Context) {
			var req pb.ResendVerificationRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			res, err := userClient.ResendVerification(context.Background(), &req)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})

		// Authenticated Users
		usersAuth := users.Group("")
		usersAuth.Use(middleware.AuthMiddleware())
		{
			usersAuth.GET("/me", func(c *gin.Context) {
				userID := c.GetString("user_id")
				res, err := userClient.GetMe(context.Background(), &pb.GetMeRequest{Id: userID})
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, res)
			})

			usersAuth.GET("/:id", func(c *gin.Context) {
				res, err := userClient.GetUserByID(context.Background(), &pb.GetUserByIDRequest{Id: c.Param("id")})
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, res)
			})

			usersAuth.PUT("/:id", func(c *gin.Context) {
				var req pb.UpdateUserRequest
				if err := c.ShouldBindJSON(&req); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
					return
				}
				req.Id = c.Param("id")
				res, err := userClient.UpdateUser(context.Background(), &req)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, res)
			})

			usersAuth.DELETE("/:id", func(c *gin.Context) {
				res, err := userClient.DeleteUser(context.Background(), &pb.DeleteUserRequest{Id: c.Param("id")})
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, res)
			})

			usersAuth.PUT("/:id/password", func(c *gin.Context) {
				var req pb.ChangePasswordRequest
				if err := c.ShouldBindJSON(&req); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
					return
				}
				req.Id = c.Param("id")
				res, err := userClient.ChangePassword(context.Background(), &req)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, res)
			})

			usersAuth.GET("", func(c *gin.Context) {
				page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
				limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
				res, err := userClient.ListUsers(context.Background(), &pb.ListUsersRequest{Page: int32(page), Limit: int32(limit)})
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, res)
			})
		}
	}

	// Auth Group for Refresh / Logout
	authGroup := api.Group("/auth")
	{
		authGroup.POST("/refresh", func(c *gin.Context) {
			var req pb.RefreshTokenRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			res, err := userClient.RefreshToken(context.Background(), &req)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})

		authGroup.POST("/logout", func(c *gin.Context) {
			authHeader := c.GetHeader("Authorization")
			var token string
			if parts := strings.Split(authHeader, " "); len(parts) == 2 && parts[0] == "Bearer" {
				token = parts[1]
			}
			res, err := userClient.Logout(context.Background(), &pb.LogoutRequest{AccessToken: token})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})
	}

	// ─────────────────────────────────────────────────────────────
	// 2. PRODUCTS
	// ─────────────────────────────────────────────────────────────
	products := api.Group("/products")
	{
		// Public
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

		products.GET("/search", func(c *gin.Context) {
			q := c.Query("q")
			if q == "" {
				q = c.Query("query")
			}
			page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
			limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
			res, err := productClient.SearchProducts(context.Background(), &pb.SearchProductsRequest{Query: q, Page: int32(page), Limit: int32(limit)})
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

		products.GET("/:id/reviews", func(c *gin.Context) {
			res, err := productClient.GetProductReviews(context.Background(), &pb.GetProductReviewsRequest{ProductId: c.Param("id")})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})

		// Authenticated Managers / Admins
		productsAuth := products.Group("")
		productsAuth.Use(middleware.AuthMiddleware())
		{
			productsAuth.POST("", func(c *gin.Context) {
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

			productsAuth.PUT("/:id", func(c *gin.Context) {
				var req pb.UpdateProductRequest
				if err := c.ShouldBindJSON(&req); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
					return
				}
				req.Id = c.Param("id")
				res, err := productClient.UpdateProduct(context.Background(), &req)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, res)
			})

			productsAuth.DELETE("/:id", func(c *gin.Context) {
				res, err := productClient.DeleteProduct(context.Background(), &pb.DeleteProductRequest{Id: c.Param("id")})
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, res)
			})

			productsAuth.PATCH("/:id/stock", func(c *gin.Context) {
				var req pb.UpdateStockRequest
				if err := c.ShouldBindJSON(&req); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
					return
				}
				req.ProductId = c.Param("id")
				res, err := productClient.UpdateStock(context.Background(), &req)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, res)
			})

			// Category alias inside products group just in case
			productsAuth.POST("/categories", func(c *gin.Context) {
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
	}

	// ─────────────────────────────────────────────────────────────
	// 3. CATEGORIES
	// ─────────────────────────────────────────────────────────────
	categories := api.Group("/categories")
	{
		// Public
		categories.GET("", func(c *gin.Context) {
			res, err := productClient.ListCategories(context.Background(), &pb.ListCategoriesRequest{})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})

		categories.GET("/:id", func(c *gin.Context) {
			res, err := productClient.GetCategory(context.Background(), &pb.GetCategoryRequest{Id: c.Param("id")})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})

		// Authenticated Managers / Admins
		categoriesAuth := categories.Group("")
		categoriesAuth.Use(middleware.AuthMiddleware())
		{
			categoriesAuth.POST("", func(c *gin.Context) {
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

			categoriesAuth.DELETE("/:id", func(c *gin.Context) {
				res, err := productClient.DeleteCategory(context.Background(), &pb.DeleteCategoryRequest{Id: c.Param("id")})
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, res)
			})
		}
	}

	// ─────────────────────────────────────────────────────────────
	// 4. ORDERS & CHECKOUT
	// ─────────────────────────────────────────────────────────────
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

		orders.GET("", func(c *gin.Context) {
			page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
			limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
			userID := c.GetString("user_id")
			res, err := orderClient.ListOrders(context.Background(), &pb.ListOrdersRequest{
				UserId: userID,
				Page:   int32(page),
				Limit:  int32(limit),
			})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})

		orders.POST("/calculate", func(c *gin.Context) {
			var req pb.CalculateTotalRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			res, err := orderClient.CalculateTotal(context.Background(), &req)
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

		orders.POST("/:id/cancel", func(c *gin.Context) {
			res, err := orderClient.CancelOrder(context.Background(), &pb.CancelOrderRequest{Id: c.Param("id")})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})

		orders.PATCH("/:id/status", func(c *gin.Context) {
			var req pb.UpdateOrderStatusRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			req.OrderId = c.Param("id")
			res, err := orderClient.UpdateOrderStatus(context.Background(), &req)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})

		orders.GET("/:id/track", func(c *gin.Context) {
			res, err := orderClient.TrackOrder(context.Background(), &pb.TrackOrderRequest{OrderId: c.Param("id")})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})

		orders.POST("/:id/discount", func(c *gin.Context) {
			var req pb.ApplyDiscountRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			req.OrderId = c.Param("id")
			res, err := orderClient.ApplyDiscount(context.Background(), &req)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})

		// Add/Remove item from order endpoints
		orders.POST("/:id/items", func(c *gin.Context) {
			var req pb.AddItemToOrderRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			req.OrderId = c.Param("id")
			res, err := orderClient.AddItemToOrder(context.Background(), &req)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})

		orders.DELETE("/:id/items/:productId", func(c *gin.Context) {
			res, err := orderClient.RemoveItemFromOrder(context.Background(), &pb.RemoveItemFromOrderRequest{
				OrderId:   c.Param("id"),
				ProductId: c.Param("productId"),
			})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})
	}

	// ─────────────────────────────────────────────────────────────
	// 5. PAYMENTS
	// ─────────────────────────────────────────────────────────────
	payments := api.Group("/payments")
	payments.Use(middleware.AuthMiddleware())
	{
		payments.POST("", func(c *gin.Context) {
			var req pb.CreatePaymentRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			res, err := orderClient.CreatePayment(context.Background(), &req)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})

		payments.GET("/:payment_id", func(c *gin.Context) {
			res, err := orderClient.GetPaymentStatus(context.Background(), &pb.GetPaymentStatusRequest{PaymentId: c.Param("payment_id")})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, res)
		})
	}
}
