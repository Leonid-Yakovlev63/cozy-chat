package service

import (
	"context"

	"github.com/Leonid-Yakovlev63/cozy-chat/internal/domain"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/infrastructure/crypto"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/infrastructure/validator"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/repository"
)

type (
	UserService interface {
		Register(ctx context.Context, username, password string) error
		GetUserByUsername(ctx context.Context, username string) (*domain.User, error)
		ListUnverifiedUsers(ctx context.Context, requesterUsername string) ([]domain.User, error)
		VerifyUser(ctx context.Context, requesterUsername, targetUsername string) error
		BlockUser(ctx context.Context, requesterUsername, targetUsername string) error
		ChangeStatus(ctx context.Context, username, status string) error
		DeleteStatus(ctx context.Context, username string) error
		ChangeAvatar(ctx context.Context, username, avatarURL string) error
		DeleteAvatar(ctx context.Context, username string) error
		ListAllUsers(ctx context.Context, requesterUsername string) ([]domain.User, error)
		EnsureAdmin(ctx context.Context, username string) error
		DeleteAccount(ctx context.Context, username string) error
	}
	userService struct {
		repo           repository.UserRepository
		messageRepo    repository.MessageRepository
		validator      validator.Validator
		passwordHasher crypto.PasswordHasher
	}
)

func NewUserService(
	repo repository.UserRepository,
	messageRepo repository.MessageRepository,
	validator validator.Validator,
	passwordHasher crypto.PasswordHasher,
) UserService {
	return &userService{
		repo:           repo,
		messageRepo:    messageRepo,
		validator:      validator,
		passwordHasher: passwordHasher,
	}
}

func (s *userService) Register(ctx context.Context, username, password string) error {
	existing, _ := s.repo.FindByUsername(ctx, username)
	if existing != nil {
		return ErrUserAlreadyExists
	}

	hashed, err := s.passwordHasher.Hash(password)
	if err != nil {
		return err
	}

	user := &domain.User{
		Username: username,
		Password: hashed,
	}

	if err := s.validator.Validate(user); err != nil {
		return ErrInvalidStruct
	}

	return s.repo.Create(ctx, user)
}

func (s *userService) GetUserByUsername(ctx context.Context, username string) (*domain.User, error) {
	return s.repo.FindByUsername(ctx, username)
}

func (s *userService) ListUnverifiedUsers(ctx context.Context, requesterUsername string) ([]domain.User, error) {
	if err := s.requireAdmin(ctx, requesterUsername); err != nil {
		return nil, err
	}
	return s.repo.FindUnverified(ctx)
}

func (s *userService) VerifyUser(ctx context.Context, requesterUsername, targetUsername string) error {
	if err := s.requireAdmin(ctx, requesterUsername); err != nil {
		return err
	}
	u, err := s.repo.FindByUsername(ctx, targetUsername)
	if err != nil {
		return err
	}
	if u == nil {
		return ErrUserNotFound
	}
	if u.Verified {
		return nil
	}
	return s.repo.SetVerified(ctx, targetUsername, true)
}

func (s *userService) BlockUser(ctx context.Context, requesterUsername, targetUsername string) error {
	if err := s.requireAdmin(ctx, requesterUsername); err != nil {
		return err
	}
	if requesterUsername == targetUsername {
		return ErrAccessDenied
	}
	u, err := s.repo.FindByUsername(ctx, targetUsername)
	if err != nil {
		return err
	}
	if u == nil {
		return ErrUserNotFound
	}
	if u.Blocked {
		return nil
	}
	if u.Role == domain.RoleAdmin {
		return ErrCannotBlockAdmin
	}

	return s.repo.SetBlocked(ctx, targetUsername, true)
}

func (s *userService) requireAdmin(ctx context.Context, username string) error {
	u, err := s.repo.FindByUsername(ctx, username)
	if err != nil {
		return err
	}
	if u == nil || u.Role != domain.RoleAdmin {
		return ErrAccessDenied
	}
	return nil
}

func (s *userService) EnsureAdmin(ctx context.Context, username string) error {
	return s.requireAdmin(ctx, username)
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

func (s *userService) ChangeAvatar(ctx context.Context, username, avatarURL string) error {
	if err := validateAvatarURL(avatarURL); err != nil {
		return err
	}
	u, err := s.repo.FindByUsername(ctx, username)
	if err != nil {
		return err
	}
	if u == nil {
		return ErrUserNotFound
	}
	return s.repo.ChangeAvatar(ctx, username, avatarURL)
}

func (s *userService) DeleteAvatar(ctx context.Context, username string) error {
	u, err := s.repo.FindByUsername(ctx, username)
	if err != nil {
		return err
	}
	if u == nil {
		return ErrUserNotFound
	}
	return s.repo.DeleteAvatar(ctx, username)
}

func (s *userService) ListAllUsers(ctx context.Context, requesterUsername string) ([]domain.User, error) {
	if err := s.requireAdmin(ctx, requesterUsername); err != nil {
		return nil, err
	}
	return s.repo.FindAll(ctx)
}

func (s *userService) DeleteAccount(ctx context.Context, username string) error {
	u, err := s.repo.FindByUsername(ctx, username)
	if err != nil {
		return err
	}
	if u == nil {
		return ErrUserNotFound
	}

	if err := s.messageRepo.DeleteByUsername(ctx, username); err != nil {
		return err
	}

	return s.repo.DeleteByUsername(ctx, username)
}
