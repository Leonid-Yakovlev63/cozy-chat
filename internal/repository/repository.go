package repository

import (
	"context"

	"github.com/Leonid-Yakovlev63/cozy-chat-backend/internal/domain"
)

type UserRepository interface {
	Create(ctx context.Context, user *domain.User) error
	//FindById(ctx context.Context, id primitive.ObjectID) (*domain.User, error)
	FindByUsername(ctx context.Context, username string) (*domain.User, error)
}

type MessageRepository interface {
}
