package repository

import (
	"context"

	"github.com/Leonid-Yakovlev63/cozy-chat/internal/domain"
)

type (
	UserRepository interface {
		Create(ctx context.Context, user *domain.User) error
		FindByUsername(ctx context.Context, username string) (*domain.User, error)
		FindUnverified(ctx context.Context) ([]domain.User, error)
		FindAll(ctx context.Context) ([]domain.User, error)
		SetVerified(ctx context.Context, username string, verified bool) error
		SetBlocked(ctx context.Context, username string, blocked bool) error
		ChangeStatus(ctx context.Context, username, status string) error
		DeleteStatus(ctx context.Context, username string) error
		ChangeAvatar(ctx context.Context, username, avatarURL string) error
		DeleteAvatar(ctx context.Context, username string) error
		FindAvatarURLsByUsernames(ctx context.Context, usernames []string) (map[string]string, error)
		DeleteByUsername(ctx context.Context, username string) error
	}

	NewsRepository interface {
		Create(ctx context.Context, news *domain.News) error
		FindAll(ctx context.Context) ([]domain.News, error)
		FindByID(ctx context.Context, id string) (*domain.News, error)
		Delete(ctx context.Context, id string) error
	}

	MessageRepository interface {
		Create(ctx context.Context, message domain.Message) error
		FindLatestMessagesBetweenUsers(
			ctx context.Context,
			firstUser, secondUser string,
			limit int64,
		) ([]domain.Message, error)
		FindMessagesBetweenUsers(
			ctx context.Context,
			firstUser, secondUser string,
			limit, offset int64,
		) ([]domain.Message, error)
		ListPeers(ctx context.Context, username string) ([]domain.Peer, error)
		MarkMessageAsRead(ctx context.Context, ID string) error
		MarkMessagesAsRead(ctx context.Context, username, targetUser string) error
		DeleteByUsername(ctx context.Context, username string) error
	}
)
