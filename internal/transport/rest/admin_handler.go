package rest

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/Leonid-Yakovlev63/cozy-chat/internal/domain"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/service"
)

type (
	AdminHandler interface {
		RegisterRoutes(mux *http.ServeMux)
		ListUnverified(w http.ResponseWriter, r *http.Request)
		VerifyUser(w http.ResponseWriter, r *http.Request)
		BlockUser(w http.ResponseWriter, r *http.Request)
	}
	adminHandler struct {
		userService service.UserService
		authService service.AuthService
	}
)

func NewAdminHandler(userService service.UserService, authService service.AuthService) AdminHandler {
	return &adminHandler{
		userService: userService,
		authService: authService,
	}
}

func (h *adminHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.Handle("GET /api/admin/users/unverified", AdminMiddleware(h.authService, h.userService)(http.HandlerFunc(h.ListUnverified)))
	mux.Handle("POST /api/admin/users/{username}/verify", AdminMiddleware(h.authService, h.userService)(http.HandlerFunc(h.VerifyUser)))
	mux.Handle("POST /api/admin/users/{username}/block", AdminMiddleware(h.authService, h.userService)(http.HandlerFunc(h.BlockUser)))
}

func (h *adminHandler) ListUnverified(w http.ResponseWriter, r *http.Request) {
	username, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	users, err := h.userService.ListUnverifiedUsers(r.Context(), username)
	switch {
	case err == nil:
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(sanitizeUsers(users))
	case errors.Is(err, service.ErrAccessDenied):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusForbidden)
	default:
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
	}
}

func (h *adminHandler) VerifyUser(w http.ResponseWriter, r *http.Request) {
	username, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	targetUsername := r.PathValue("username")
	if targetUsername == "" {
		http.Error(w, `{"error":"invalid request"}`, http.StatusBadRequest)
		return
	}

	err := h.userService.VerifyUser(r.Context(), username, targetUsername)
	switch {
	case err == nil:
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "user verified successfully"})
	case errors.Is(err, service.ErrAccessDenied):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusForbidden)
	case errors.Is(err, service.ErrUserNotFound):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusNotFound)
	default:
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
	}
}

func (h *adminHandler) BlockUser(w http.ResponseWriter, r *http.Request) {
	username, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	targetUsername := r.PathValue("username")
	if targetUsername == "" {
		http.Error(w, `{"error":"invalid request"}`, http.StatusBadRequest)
		return
	}

	err := h.userService.BlockUser(r.Context(), username, targetUsername)
	switch {
	case err == nil:
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "user blocked successfully"})
	case errors.Is(err, service.ErrAccessDenied):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusForbidden)
	case errors.Is(err, service.ErrUserNotFound):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusNotFound)
	default:
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
	}
}

func sanitizeUsers(users []domain.User) []domain.User {
	sanitized := make([]domain.User, len(users))
	for i, u := range users {
		u.Password = ""
		sanitized[i] = u
	}
	return sanitized
}
