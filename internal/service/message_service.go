package service

import (
	"context"

	"github.com/Leonid-Yakovlev63/cozy-chat-backend/internal/domain"
	"github.com/Leonid-Yakovlev63/cozy-chat-backend/internal/repository"
)

type (
	MessageService interface {
		SendMessage(ctx context.Context, message domain.Message) error
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
