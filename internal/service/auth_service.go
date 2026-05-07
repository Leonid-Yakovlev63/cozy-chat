package service

import (
	"context"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type (
	AuthService interface {
		Login(ctx context.Context, username, password string) (string, error)
		ValidateToken(tokenString string) (*jwt.RegisteredClaims, error)
	}

	authService struct {
		userService UserService
		secret      []byte
		expiration  time.Duration
	}
)

func NewAuthService(userService UserService, secret string, expirationHours int) AuthService {
	return &authService{
		userService: userService,
		secret:      []byte(secret),
		expiration:  time.Duration(expirationHours) * time.Hour,
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

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", ErrInvalidPassword
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Subject: user.Username,

		ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.expiration)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	})

	return token.SignedString(s.secret)
}

func (s *authService) ValidateToken(tokenString string) (*jwt.RegisteredClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return s.secret, nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}
