package service

import (
	"context"

	"github.com/Leonid-Yakovlev63/cozy-chat/internal/domain"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/infrastructure/validator"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/repository"
)

type (
	NewsService interface {
		ListNews(ctx context.Context) ([]domain.News, error)
		CreateNews(ctx context.Context, requesterUsername, title, content string) (*domain.News, error)
		DeleteNews(ctx context.Context, requesterUsername, id string) error
	}

	newsService struct {
		repo        repository.NewsRepository
		userService UserService
		validator   validator.Validator
	}
)

func NewNewsService(repo repository.NewsRepository, userService UserService, validator validator.Validator) NewsService {
	return &newsService{
		repo:        repo,
		userService: userService,
		validator:   validator,
	}
}

func (s *newsService) ListNews(ctx context.Context) ([]domain.News, error) {
	return s.repo.FindAll(ctx)
}

func (s *newsService) CreateNews(ctx context.Context, requesterUsername, title, content string) (*domain.News, error) {
	if err := s.requireAdmin(ctx, requesterUsername); err != nil {
		return nil, err
	}

	news := &domain.News{
		Title:          title,
		Content:        content,
		AuthorUsername: requesterUsername,
	}
	if err := s.validator.Validate(news); err != nil {
		return nil, ErrInvalidStruct
	}

	if err := s.repo.Create(ctx, news); err != nil {
		return nil, err
	}
	return news, nil
}

func (s *newsService) DeleteNews(ctx context.Context, requesterUsername, id string) error {
	if err := s.requireAdmin(ctx, requesterUsername); err != nil {
		return err
	}
	item, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if item == nil {
		return ErrNewsNotFound
	}
	return s.repo.Delete(ctx, id)
}

func (s *newsService) requireAdmin(ctx context.Context, username string) error {
	u, err := s.userService.GetUserByUsername(ctx, username)
	if err != nil {
		return err
	}
	if u == nil || u.Role != domain.RoleAdmin {
		return ErrAccessDenied
	}
	return nil
}
