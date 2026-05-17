package grpc

import (
	"context"
	pb "online-shop/pb"
	"product-service/internal/usecase"
)

type ProductHandler struct {
	pb.UnimplementedProductServiceServer
	usecase *usecase.ProductUsecase
}

func NewProductHandler(usecase *usecase.ProductUsecase) *ProductHandler {
	return &ProductHandler{usecase: usecase}
}

func (h *ProductHandler) CreateProduct(ctx context.Context, req *pb.CreateProductRequest) (*pb.CreateProductResponse, error) {
	p, err := h.usecase.CreateProduct(req.Name, req.Description, req.Price, int(req.Stock), req.CategoryId)
	if err != nil {
		return nil, err
	}
	return &pb.CreateProductResponse{Product: &pb.Product{Id: p.ID, Name: p.Name, Description: p.Description, Price: p.Price, Stock: int32(p.Stock), CategoryId: p.CategoryID}}, nil
}

func (h *ProductHandler) GetProductByID(ctx context.Context, req *pb.GetProductByIDRequest) (*pb.GetProductByIDResponse, error) {
	p, err := h.usecase.GetProductByID(req.Id)
	if err != nil {
		return nil, err
	}
	return &pb.GetProductByIDResponse{Product: &pb.Product{Id: p.ID, Name: p.Name, Description: p.Description, Price: p.Price, Stock: int32(p.Stock), CategoryId: p.CategoryID}}, nil
}

func (h *ProductHandler) UpdateProduct(ctx context.Context, req *pb.UpdateProductRequest) (*pb.UpdateProductResponse, error) {
	p, err := h.usecase.UpdateProduct(req.Id, req.Name, req.Description, req.Price, req.CategoryId)
	if err != nil {
		return nil, err
	}
	return &pb.UpdateProductResponse{Product: &pb.Product{Id: p.ID, Name: p.Name, Description: p.Description, Price: p.Price, Stock: int32(p.Stock), CategoryId: p.CategoryID}}, nil
}

func (h *ProductHandler) DeleteProduct(ctx context.Context, req *pb.DeleteProductRequest) (*pb.DeleteProductResponse, error) {
	err := h.usecase.DeleteProduct(req.Id)
	return &pb.DeleteProductResponse{Success: err == nil}, err
}

func (h *ProductHandler) ListProducts(ctx context.Context, req *pb.ListProductsRequest) (*pb.ListProductsResponse, error) {
	products, total, err := h.usecase.ListProducts(int(req.Page), int(req.Limit))
	if err != nil {
		return nil, err
	}
	var pbProducts []*pb.Product
	for _, p := range products {
		pbProducts = append(pbProducts, &pb.Product{Id: p.ID, Name: p.Name, Description: p.Description, Price: p.Price, Stock: int32(p.Stock), CategoryId: p.CategoryID})
	}
	return &pb.ListProductsResponse{Products: pbProducts, Total: int32(total)}, nil
}

func (h *ProductHandler) SearchProducts(ctx context.Context, req *pb.SearchProductsRequest) (*pb.SearchProductsResponse, error) {
	products, total, err := h.usecase.SearchProducts(req.Query, int(req.Page), int(req.Limit))
	if err != nil {
		return nil, err
	}
	var pbProducts []*pb.Product
	for _, p := range products {
		pbProducts = append(pbProducts, &pb.Product{Id: p.ID, Name: p.Name, Description: p.Description, Price: p.Price, Stock: int32(p.Stock), CategoryId: p.CategoryID})
	}
	return &pb.SearchProductsResponse{Products: pbProducts, Total: int32(total)}, nil
}

func (h *ProductHandler) CreateCategory(ctx context.Context, req *pb.CreateCategoryRequest) (*pb.CreateCategoryResponse, error) {
	c, err := h.usecase.CreateCategory(req.Name)
	if err != nil {
		return nil, err
	}
	return &pb.CreateCategoryResponse{Category: &pb.Category{Id: c.ID, Name: c.Name}}, nil
}

func (h *ProductHandler) GetCategory(ctx context.Context, req *pb.GetCategoryRequest) (*pb.GetCategoryResponse, error) {
	c, err := h.usecase.GetCategory(req.Id)
	if err != nil {
		return nil, err
	}
	return &pb.GetCategoryResponse{Category: &pb.Category{Id: c.ID, Name: c.Name}}, nil
}

func (h *ProductHandler) ListCategories(ctx context.Context, req *pb.ListCategoriesRequest) (*pb.ListCategoriesResponse, error) {
	cats, err := h.usecase.ListCategories()
	if err != nil {
		return nil, err
	}
	var pbCats []*pb.Category
	for _, c := range cats {
		pbCats = append(pbCats, &pb.Category{Id: c.ID, Name: c.Name})
	}
	return &pb.ListCategoriesResponse{Categories: pbCats}, nil
}

func (h *ProductHandler) DeleteCategory(ctx context.Context, req *pb.DeleteCategoryRequest) (*pb.DeleteCategoryResponse, error) {
	err := h.usecase.DeleteCategory(req.Id)
	return &pb.DeleteCategoryResponse{Success: err == nil}, err
}

func (h *ProductHandler) UpdateStock(ctx context.Context, req *pb.UpdateStockRequest) (*pb.UpdateStockResponse, error) {
	err := h.usecase.UpdateStock(req.ProductId, int(req.Quantity))
	return &pb.UpdateStockResponse{Success: err == nil}, err
}

func (h *ProductHandler) GetProductReviews(ctx context.Context, req *pb.GetProductReviewsRequest) (*pb.GetProductReviewsResponse, error) {
	revs, err := h.usecase.GetProductReviews(req.ProductId)
	if err != nil {
		return nil, err
	}
	var pbRevs []*pb.Review
	for _, r := range revs {
		pbRevs = append(pbRevs, &pb.Review{Id: r.ID, UserId: r.UserID, ProductId: r.ProductID, Rating: int32(r.Rating), Comment: r.Comment})
	}
	return &pb.GetProductReviewsResponse{Reviews: pbRevs}, nil
}
