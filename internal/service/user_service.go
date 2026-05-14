package service

import (
	"context"

	"github.com/Leonid-Yakovlev63/cozy-chat/internal/domain"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/infrastructure/validator"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type (
	UserService interface {
		Register(ctx context.Context, username, password string) error
		GetUserByUsername(ctx context.Context, username string) (*domain.User, error)
		ChangeStatus(ctx context.Context, username, status string) error
		DeleteStatus(ctx context.Context, username string) error
	}
	userService struct {
		repo      repository.UserRepository
		validator validator.Validator
	}
)

func NewUserService(repo repository.UserRepository, validator validator.Validator) *userService {
	return &userService{
		repo:      repo,
		validator: validator,
	}
}

func (s *userService) Register(ctx context.Context, username, password string) error {
	existing, _ := s.repo.FindByUsername(ctx, username)
	if existing != nil {
		return ErrUserAlreadyExists
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user := &domain.User{
		Username: username,
		Password: string(hashed),
	}

	if err := s.validator.Validate(user); err != nil {
		return ErrInvalidStruct
	}

	return s.repo.Create(ctx, user)
}

func (s *userService) GetUserByUsername(ctx context.Context, username string) (*domain.User, error) {
	return s.repo.FindByUsername(ctx, username)
}

func (s *userService) ChangeStatus(ctx context.Context, username, status string) error {
	u, err := s.repo.FindByUsername(ctx, username)
	if err != nil {
		return err
	}
	if u == nil {
		return ErrUserNotFound
	}
	return s.repo.ChangeStatus(ctx, username, status)
}

func (s *userService) DeleteStatus(ctx context.Context, username string) error {
	u, err := s.repo.FindByUsername(ctx, username)
	if err != nil {
		return err
	}
	if u == nil {
		return ErrUserNotFound
	}
	return s.repo.DeleteStatus(ctx, username)
}
