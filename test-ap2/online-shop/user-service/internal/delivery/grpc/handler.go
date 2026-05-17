package grpc

import (
	"context"
	pb "online-shop/pb"
	"user-service/internal/usecase"
	"time"
)

type UserHandler struct {
	pb.UnimplementedUserServiceServer
	usecase *usecase.UserUsecase
}

func NewUserHandler(usecase *usecase.UserUsecase) *UserHandler {
	return &UserHandler{usecase: usecase}
}

func (h *UserHandler) RegisterUser(ctx context.Context, req *pb.RegisterUserRequest) (*pb.RegisterUserResponse, error) {
	user, err := h.usecase.Register(req.Email, req.Password, req.Name)
	if err != nil {
		return nil, err
	}
	return &pb.RegisterUserResponse{
		User: &pb.User{
			Id: user.ID, Email: user.Email, Name: user.Name, IsVerified: user.IsVerified,
			CreatedAt: user.CreatedAt.Format(time.RFC3339), UpdatedAt: user.UpdatedAt.Format(time.RFC3339),
		},
	}, nil
}

func (h *UserHandler) LoginUser(ctx context.Context, req *pb.LoginUserRequest) (*pb.LoginUserResponse, error) {
	access, refresh, user, err := h.usecase.Login(req.Email, req.Password)
	if err != nil {
		return nil, err
	}
	return &pb.LoginUserResponse{
		AccessToken: access, RefreshToken: refresh,
		User: &pb.User{
			Id: user.ID, Email: user.Email, Name: user.Name, IsVerified: user.IsVerified,
			CreatedAt: user.CreatedAt.Format(time.RFC3339), UpdatedAt: user.UpdatedAt.Format(time.RFC3339),
		},
	}, nil
}

func (h *UserHandler) RefreshToken(ctx context.Context, req *pb.RefreshTokenRequest) (*pb.RefreshTokenResponse, error) {
	return &pb.RefreshTokenResponse{AccessToken: "new_dummy_token"}, nil
}

func (h *UserHandler) Logout(ctx context.Context, req *pb.LogoutRequest) (*pb.LogoutResponse, error) {
	return &pb.LogoutResponse{Success: true}, nil
}

func (h *UserHandler) GetUserByID(ctx context.Context, req *pb.GetUserByIDRequest) (*pb.GetUserByIDResponse, error) {
	user, err := h.usecase.GetByID(req.Id)
	if err != nil {
		return nil, err
	}
	return &pb.GetUserByIDResponse{
		User: &pb.User{
			Id: user.ID, Email: user.Email, Name: user.Name, IsVerified: user.IsVerified,
		},
	}, nil
}

func (h *UserHandler) GetMe(ctx context.Context, req *pb.GetMeRequest) (*pb.GetMeResponse, error) {
	user, err := h.usecase.GetByID(req.Id)
	if err != nil {
		return nil, err
	}
	return &pb.GetMeResponse{
		User: &pb.User{
			Id: user.ID, Email: user.Email, Name: user.Name, IsVerified: user.IsVerified,
		},
	}, nil
}

func (h *UserHandler) UpdateUser(ctx context.Context, req *pb.UpdateUserRequest) (*pb.UpdateUserResponse, error) {
	user, err := h.usecase.Update(req.Id, req.Name)
	if err != nil {
		return nil, err
	}
	return &pb.UpdateUserResponse{
		User: &pb.User{
			Id: user.ID, Email: user.Email, Name: user.Name, IsVerified: user.IsVerified,
		},
	}, nil
}

func (h *UserHandler) DeleteUser(ctx context.Context, req *pb.DeleteUserRequest) (*pb.DeleteUserResponse, error) {
	err := h.usecase.Delete(req.Id)
	return &pb.DeleteUserResponse{Success: err == nil}, err
}

func (h *UserHandler) ChangePassword(ctx context.Context, req *pb.ChangePasswordRequest) (*pb.ChangePasswordResponse, error) {
	err := h.usecase.ChangePassword(req.Id, req.OldPassword, req.NewPassword)
	return &pb.ChangePasswordResponse{Success: err == nil}, err
}

func (h *UserHandler) VerifyEmail(ctx context.Context, req *pb.VerifyEmailRequest) (*pb.VerifyEmailResponse, error) {
	err := h.usecase.VerifyEmail(req.Token)
	return &pb.VerifyEmailResponse{Success: err == nil}, err
}

func (h *UserHandler) ResendVerification(ctx context.Context, req *pb.ResendVerificationRequest) (*pb.ResendVerificationResponse, error) {
	return &pb.ResendVerificationResponse{Success: true}, nil
}

func (h *UserHandler) ListUsers(ctx context.Context, req *pb.ListUsersRequest) (*pb.ListUsersResponse, error) {
	users, total, err := h.usecase.List(int(req.Page), int(req.Limit))
	if err != nil {
		return nil, err
	}
	var pbUsers []*pb.User
	for _, u := range users {
		pbUsers = append(pbUsers, &pb.User{
			Id: u.ID, Email: u.Email, Name: u.Name, IsVerified: u.IsVerified,
		})
	}
	return &pb.ListUsersResponse{Users: pbUsers, Total: int32(total)}, nil
}
