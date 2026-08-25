package service

import (
	"context"
	"log/slog"

	"github.com/Leonid-Yakovlev63/cozy-chat/internal/domain"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/repository"
)

const (
	defaultMessagesPageLimit = int64(100)
	maxMessagesPageLimit     = int64(100)
)

type (
	MessageService interface {
		SendMessage(ctx context.Context, fromUser, toUser, content string) error
		ReadLatestMessagesFromUser(ctx context.Context, username, targetUser string) ([]domain.Message, error)
		ReadMessagesFromUser(ctx context.Context, username, targetUser string, limit, offset int64) ([]domain.Message, error)
		ListPeers(ctx context.Context, username string) ([]domain.Peer, error)
	}
	messageSerivce struct {
		messageRepository repository.MessageRepository
		userRepository    repository.UserRepository
		userService       UserService
	}
)

func NewMessageService(
	messageRepository repository.MessageRepository,
	userRepository repository.UserRepository,
	userService UserService,
) MessageService {
	return &messageSerivce{
		messageRepository: messageRepository,
		userRepository:    userRepository,
		userService:       userService,
	}
}

func (s *messageSerivce) SendMessage(ctx context.Context, fromUser, toUser, content string) error {
	if fromUser == toUser {
		return ErrFromUserEqualsToUser
	}

	userToSend, err := s.userRepository.FindByUsername(ctx, toUser)
	if err != nil {
		return err
	}
	if userToSend == nil {
		return ErrUserNotFound
	}

	message := domain.NewMessage(fromUser, toUser, content)
	return s.messageRepository.Create(ctx, message)
}

func (s *messageSerivce) ReadLatestMessagesFromUser(ctx context.Context, username, targetUser string) ([]domain.Message, error) {
	if username == targetUser {
		return nil, ErrReadMessagesFromYourself
	}

	found, err := s.userRepository.FindByUsername(ctx, targetUser)
	if err != nil {
		return nil, err
	}

	if found == nil {
		return nil, ErrUserNotFound
	}

	foundMessages, err := s.messageRepository.FindLatestMessagesBetweenUsers(ctx, username, targetUser, 100)
	if err != nil {
		return nil, err
	}

	bgCtx := context.WithoutCancel(ctx)

	go func() {
		if err := s.messageRepository.MarkMessagesAsRead(bgCtx, username, targetUser); err != nil {
			slog.Error(err.Error())
		}
	}()

	return foundMessages, nil
}

func (s *messageSerivce) ReadMessagesFromUser(
	ctx context.Context,
	username, targetUser string,
	limit, offset int64,
) ([]domain.Message, error) {
	if username == targetUser {
		return nil, ErrReadMessagesFromYourself
	}

	if limit <= 0 {
		limit = defaultMessagesPageLimit
	}
	if limit > maxMessagesPageLimit {
		return nil, ErrInvalidMessagesPagination
	}
	if offset < 0 {
		return nil, ErrInvalidMessagesPagination
	}

	found, err := s.userRepository.FindByUsername(ctx, targetUser)
	if err != nil {
		return nil, err
	}

	if found == nil {
		return nil, ErrUserNotFound
	}

	foundMessages, err := s.messageRepository.FindMessagesBetweenUsers(ctx, username, targetUser, limit, offset)
	if err != nil {
		return nil, err
	}

	bgCtx := context.WithoutCancel(ctx)

	go func() {
		if err := s.messageRepository.MarkMessagesAsRead(bgCtx, username, targetUser); err != nil {
			slog.Error(err.Error())
		}
	}()

	return foundMessages, nil
}

func (s *messageSerivce) ListPeers(ctx context.Context, username string) ([]domain.Peer, error) {
	peers, err := s.messageRepository.ListPeers(ctx, username)
	if err != nil {
		return nil, err
	}
	if len(peers) == 0 {
		return peers, nil
	}

	usernames := make([]string, 0, len(peers))
	for _, peer := range peers {
		usernames = append(usernames, peer.Username)
	}

	avatars, err := s.userRepository.FindAvatarURLsByUsernames(ctx, usernames)
	if err != nil {
		return nil, err
	}

	for i := range peers {
		peers[i].AvatarURL = avatars[peers[i].Username]
	}

	return peers, nil
}
