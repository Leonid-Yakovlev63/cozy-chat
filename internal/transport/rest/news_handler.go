package rest

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/Leonid-Yakovlev63/cozy-chat/internal/dto"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/infrastructure/validator"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/service"
)

type (
	NewsHandler interface {
		RegisterRoutes(mux *http.ServeMux)
		ListNews(w http.ResponseWriter, r *http.Request)
		CreateNews(w http.ResponseWriter, r *http.Request)
		DeleteNews(w http.ResponseWriter, r *http.Request)
	}
	newsHandler struct {
		newsService service.NewsService
		userService service.UserService
		authService service.AuthService
		validator   validator.Validator
	}
)

func NewNewsHandler(
	newsService service.NewsService,
	userService service.UserService,
	authService service.AuthService,
	validator validator.Validator,
) NewsHandler {
	return &newsHandler{
		newsService: newsService,
		userService: userService,
		authService: authService,
		validator:   validator,
	}
}

func (h *newsHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.Handle("GET /api/news", AuthMiddleware(h.authService)(http.HandlerFunc(h.ListNews)))
	mux.Handle("POST /api/admin/news", AdminMiddleware(h.authService, h.userService)(http.HandlerFunc(h.CreateNews)))
	mux.Handle("DELETE /api/admin/news/{id}", AdminMiddleware(h.authService, h.userService)(http.HandlerFunc(h.DeleteNews)))
}

func (h *newsHandler) ListNews(w http.ResponseWriter, r *http.Request) {
	items, err := h.newsService.ListNews(r.Context())
	if err != nil {
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(items)
}

func (h *newsHandler) CreateNews(w http.ResponseWriter, r *http.Request) {
	username, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req dto.CreateNewsRequestDto
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request"}`, http.StatusBadRequest)
		return
	}
	if err := h.validator.Validate(req); err != nil {
		http.Error(w, `{"error":"validation failed: title 1–200 chars, content 1–10000 chars"}`, http.StatusBadRequest)
		return
	}

	item, err := h.newsService.CreateNews(r.Context(), username, req.Title, req.Content)
	switch {
	case err == nil:
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(item)
	case errors.Is(err, service.ErrAccessDenied):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusForbidden)
	case errors.Is(err, service.ErrInvalidStruct):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
	default:
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
	}
}

func (h *newsHandler) DeleteNews(w http.ResponseWriter, r *http.Request) {
	username, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	id := r.PathValue("id")
	if id == "" {
		http.Error(w, `{"error":"invalid request"}`, http.StatusBadRequest)
		return
	}

	err := h.newsService.DeleteNews(r.Context(), username, id)
	switch {
	case err == nil:
		w.WriteHeader(http.StatusNoContent)
	case errors.Is(err, service.ErrAccessDenied):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusForbidden)
	case errors.Is(err, service.ErrNewsNotFound):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusNotFound)
	default:
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
	}
}
