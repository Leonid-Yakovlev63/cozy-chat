package service

import (
	"context"
	"log/slog"

	"github.com/Leonid-Yakovlev63/cozy-chat-backend/internal/domain"
	"github.com/Leonid-Yakovlev63/cozy-chat-backend/internal/repository"
)

type (
	MessageService interface {
		SendMessage(ctx context.Context, message domain.Message) error
		ReadLatestMessagesFromUser(ctx context.Context, username, targetUser string) ([]domain.Message, error)
	}
	messageSerivce struct {
		messageRepository repository.MessageRepository
		userRepository    repository.UserRepository
	}
)

func NewMessageService(messageRepository repository.MessageRepository, userRepository repository.UserRepository) MessageService {
	return &messageSerivce{messageRepository: messageRepository, userRepository: userRepository}
}

func (s *messageSerivce) SendMessage(ctx context.Context, message domain.Message) error {

	if message.FromUser == message.ToUser {
		return ErrFromUserEqualsToUser
	}

	userToSend, _ := s.userRepository.FindByUsername(ctx, message.ToUser)
	if userToSend == nil {
		return ErrUserNotFound
	}

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
