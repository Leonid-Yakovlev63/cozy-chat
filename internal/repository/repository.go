package repository

import (
	"context"

	"github.com/Leonid-Yakovlev63/cozy-chat-backend/internal/domain"
)

type (
	UserRepository interface {
		Create(ctx context.Context, user *domain.User) error
		FindByUsername(ctx context.Context, username string) (*domain.User, error)
	}

	MessageRepository interface {
		Create(ctx context.Context, message domain.Message) error
		FindLatestMessagesBetweenUsers(
			ctx context.Context,
			firstUser, secondUser string,
			limit int64,
		) ([]domain.Message, error)
		ListPeers(ctx context.Context, username string) ([]domain.Peer, error)
		MarkMessageAsRead(ctx context.Context, ID string) error
		MarkMessagesAsRead(ctx context.Context, username, targetUser string) error
	}
)
