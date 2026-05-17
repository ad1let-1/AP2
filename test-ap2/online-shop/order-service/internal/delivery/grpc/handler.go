package grpc

import (
	"context"
	pb "online-shop/pb"
	"order-service/internal/usecase"
	"order-service/internal/domain"
	"time"
)

type OrderHandler struct {
	pb.UnimplementedOrderServiceServer
	usecase *usecase.OrderUsecase
}

func NewOrderHandler(usecase *usecase.OrderUsecase) *OrderHandler {
	return &OrderHandler{usecase: usecase}
}

func mapOrderToPB(o *domain.Order) *pb.Order {
	var items []*pb.OrderItem
	for _, it := range o.Items {
		items = append(items, &pb.OrderItem{ProductId: it.ProductID, Quantity: int32(it.Quantity), Price: it.Price})
	}
	return &pb.Order{
		Id: o.ID, UserId: o.UserID, Items: items, TotalAmount: o.TotalAmount, Status: o.Status, CreatedAt: o.CreatedAt.Format(time.RFC3339),
	}
}

func (h *OrderHandler) CreateOrder(ctx context.Context, req *pb.CreateOrderRequest) (*pb.CreateOrderResponse, error) {
	var items []domain.OrderItem
	for _, it := range req.Items {
		items = append(items, domain.OrderItem{ProductID: it.ProductId, Quantity: int(it.Quantity), Price: it.Price})
	}
	o, err := h.usecase.CreateOrder(req.UserId, items)
	if err != nil {
		return nil, err
	}
	return &pb.CreateOrderResponse{Order: mapOrderToPB(o)}, nil
}

func (h *OrderHandler) GetOrderByID(ctx context.Context, req *pb.GetOrderByIDRequest) (*pb.GetOrderByIDResponse, error) {
	o, err := h.usecase.GetOrderByID(req.Id)
	if err != nil {
		return nil, err
	}
	return &pb.GetOrderByIDResponse{Order: mapOrderToPB(o)}, nil
}

func (h *OrderHandler) ListOrders(ctx context.Context, req *pb.ListOrdersRequest) (*pb.ListOrdersResponse, error) {
	orders, total, err := h.usecase.ListOrders(req.UserId, int(req.Page), int(req.Limit))
	if err != nil {
		return nil, err
	}
	var pbOrders []*pb.Order
	for _, o := range orders {
		pbOrders = append(pbOrders, mapOrderToPB(o))
	}
	return &pb.ListOrdersResponse{Orders: pbOrders, Total: int32(total)}, nil
}

func (h *OrderHandler) CancelOrder(ctx context.Context, req *pb.CancelOrderRequest) (*pb.CancelOrderResponse, error) {
	err := h.usecase.CancelOrder(req.Id)
	return &pb.CancelOrderResponse{Success: err == nil}, err
}

func (h *OrderHandler) CreatePayment(ctx context.Context, req *pb.CreatePaymentRequest) (*pb.CreatePaymentResponse, error) {
	p, err := h.usecase.CreatePayment(req.OrderId, req.PaymentMethod)
	if err != nil {
		return nil, err
	}
	return &pb.CreatePaymentResponse{PaymentId: p.ID, Status: p.Status}, nil
}

func (h *OrderHandler) GetPaymentStatus(ctx context.Context, req *pb.GetPaymentStatusRequest) (*pb.GetPaymentStatusResponse, error) {
	status, err := h.usecase.GetPaymentStatus(req.PaymentId)
	if err != nil {
		return nil, err
	}
	return &pb.GetPaymentStatusResponse{Status: status}, nil
}

func (h *OrderHandler) UpdateOrderStatus(ctx context.Context, req *pb.UpdateOrderStatusRequest) (*pb.UpdateOrderStatusResponse, error) {
	err := h.usecase.UpdateOrderStatus(req.OrderId, req.Status)
	return &pb.UpdateOrderStatusResponse{Success: err == nil}, err
}

func (h *OrderHandler) TrackOrder(ctx context.Context, req *pb.TrackOrderRequest) (*pb.TrackOrderResponse, error) {
	info, err := h.usecase.TrackOrder(req.OrderId)
	if err != nil {
		return nil, err
	}
	return &pb.TrackOrderResponse{TrackingInfo: info}, nil
}

func (h *OrderHandler) ApplyDiscount(ctx context.Context, req *pb.ApplyDiscountRequest) (*pb.ApplyDiscountResponse, error) {
	o, newTotal, err := h.usecase.ApplyDiscount(req.OrderId, req.DiscountCode)
	if err != nil {
		return nil, err
	}
	return &pb.ApplyDiscountResponse{Order: mapOrderToPB(o), NewTotal: newTotal}, nil
}

func (h *OrderHandler) CalculateTotal(ctx context.Context, req *pb.CalculateTotalRequest) (*pb.CalculateTotalResponse, error) {
	var items []domain.OrderItem
	for _, it := range req.Items {
		items = append(items, domain.OrderItem{ProductID: it.ProductId, Quantity: int(it.Quantity), Price: it.Price})
	}
	total := h.usecase.CalculateTotal(items, req.DiscountCode)
	return &pb.CalculateTotalResponse{TotalAmount: total}, nil
}

func (h *OrderHandler) AddItemToOrder(ctx context.Context, req *pb.AddItemToOrderRequest) (*pb.AddItemToOrderResponse, error) {
	item := domain.OrderItem{ProductID: req.Item.ProductId, Quantity: int(req.Item.Quantity), Price: req.Item.Price}
	o, err := h.usecase.AddItemToOrder(req.OrderId, item)
	if err != nil {
		return nil, err
	}
	return &pb.AddItemToOrderResponse{Order: mapOrderToPB(o)}, nil
}

func (h *OrderHandler) RemoveItemFromOrder(ctx context.Context, req *pb.RemoveItemFromOrderRequest) (*pb.RemoveItemFromOrderResponse, error) {
	o, err := h.usecase.RemoveItemFromOrder(req.OrderId, req.ProductId)
	if err != nil {
		return nil, err
	}
	return &pb.RemoveItemFromOrderResponse{Order: mapOrderToPB(o)}, nil
}
