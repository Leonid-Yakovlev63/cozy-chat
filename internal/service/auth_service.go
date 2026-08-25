package service

import (
	"context"

	"github.com/Leonid-Yakovlev63/cozy-chat/internal/infrastructure/crypto"
	jwtpkg "github.com/Leonid-Yakovlev63/cozy-chat/internal/infrastructure/jwt"
)

type TokenClaims struct {
	Subject string
}

type (
	AuthService interface {
		Login(ctx context.Context, username, password string) (string, error)
		ValidateToken(tokenString string) (*TokenClaims, error)
	}

	authService struct {
		userService    UserService
		tokenProvider  jwtpkg.TokenProvider
		passwordHasher crypto.PasswordHasher
	}
)

func NewAuthService(
	userService UserService,
	tokenProvider jwtpkg.TokenProvider,
	passwordHasher crypto.PasswordHasher,
) AuthService {
	return &authService{
		userService:    userService,
		tokenProvider:  tokenProvider,
		passwordHasher: passwordHasher,
	}
}

func (s *authService) Login(ctx context.Context, username, password string) (string, error) {
	user, err := s.userService.GetUserByUsername(ctx, username)
	if err != nil {
		return "", err
	}
	if user == nil {
		return "", ErrUserNotFound
	}
	if user.Blocked {
		return "", ErrUserBlocked
	}
	if !user.Verified {
		return "", ErrUserNotVerified
	}

	if err := s.passwordHasher.Compare(user.Password, password); err != nil {
		return "", ErrInvalidPassword
	}

	return s.tokenProvider.Generate(user.Username)
}

func (s *authService) ValidateToken(tokenString string) (*TokenClaims, error) {
	claims, err := s.tokenProvider.Validate(tokenString)
	if err != nil {
		return nil, err
	}

	return &TokenClaims{Subject: claims.Subject}, nil
}
