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
	UserHandler interface {
		RegisterRoutes(mux *http.ServeMux)
		ChangeStatus(w http.ResponseWriter, r *http.Request)
		DeleteStatus(w http.ResponseWriter, r *http.Request)
		ChangeAvatar(w http.ResponseWriter, r *http.Request)
		DeleteAvatar(w http.ResponseWriter, r *http.Request)
		GetMyProfile(w http.ResponseWriter, r *http.Request)
		DeleteAccount(w http.ResponseWriter, r *http.Request)
	}
	userHandler struct {
		userService service.UserService
		authService service.AuthService
		validator   validator.Validator
	}
)

func NewUserHandler(userService service.UserService, authService service.AuthService, validator validator.Validator) UserHandler {
	return &userHandler{userService: userService, authService: authService, validator: validator}
}

func (h *userHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.Handle("PATCH /api/users/status", AuthMiddleware(h.authService)(http.HandlerFunc(h.ChangeStatus)))
	mux.Handle("DELETE /api/users/status", AuthMiddleware(h.authService)(http.HandlerFunc(h.DeleteStatus)))
	mux.Handle("PATCH /api/users/avatar", AuthMiddleware(h.authService)(http.HandlerFunc(h.ChangeAvatar)))
	mux.Handle("DELETE /api/users/avatar", AuthMiddleware(h.authService)(http.HandlerFunc(h.DeleteAvatar)))
	mux.Handle("GET /api/users/me", AuthMiddleware(h.authService)(http.HandlerFunc(h.GetMyProfile)))
	mux.Handle("DELETE /api/users/me", AuthMiddleware(h.authService)(http.HandlerFunc(h.DeleteAccount)))
}

func (h *userHandler) ChangeStatus(w http.ResponseWriter, r *http.Request) {
	username, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req dto.ChangeStatusRequestDto
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request"}`, http.StatusBadRequest)
		return
	}

	if err := h.validator.Validate(req); err != nil {
		http.Error(w, `{"error":"validation failed: status must be 1–500 characters"}`, http.StatusBadRequest)
		return
	}

	err := h.userService.ChangeStatus(r.Context(), username, req.Status)
	switch {
	case err == nil:
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "status updated successfully"})
	case errors.Is(err, service.ErrUserNotFound):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusNotFound)
	default:
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
	}
}

func (h *userHandler) ChangeAvatar(w http.ResponseWriter, r *http.Request) {
	username, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req dto.ChangeAvatarRequestDto
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request"}`, http.StatusBadRequest)
		return
	}

	if err := h.validator.Validate(req); err != nil {
		http.Error(w, `{"error":"validation failed: avatarUrl is required and must be at most 2048 characters"}`, http.StatusBadRequest)
		return
	}

	err := h.userService.ChangeAvatar(r.Context(), username, req.AvatarURL)
	switch {
	case err == nil:
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "avatar updated successfully"})
	case errors.Is(err, service.ErrInvalidAvatarURL):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
	case errors.Is(err, service.ErrUserNotFound):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusNotFound)
	default:
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
	}
}

func (h *userHandler) DeleteAvatar(w http.ResponseWriter, r *http.Request) {
	username, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	err := h.userService.DeleteAvatar(r.Context(), username)
	switch {
	case err == nil:
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "avatar deleted successfully"})
	case errors.Is(err, service.ErrUserNotFound):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusNotFound)
	default:
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
	}
}

func (h *userHandler) GetMyProfile(w http.ResponseWriter, r *http.Request) {
	username, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	user, err := h.userService.GetUserByUsername(r.Context(), username)
	switch {
	case err != nil:
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
	case user == nil:
		http.Error(w, `{"error":"`+service.ErrUserNotFound.Error()+`"}`, http.StatusNotFound)
	default:
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(user)
	}
}

func (h *userHandler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	username, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	err := h.userService.DeleteAccount(r.Context(), username)
	switch {
	case err == nil:
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "account deleted successfully"})
	case errors.Is(err, service.ErrUserNotFound):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusNotFound)
	default:
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
	}
}

func (h *userHandler) DeleteStatus(w http.ResponseWriter, r *http.Request) {
	username, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	err := h.userService.DeleteStatus(r.Context(), username)
	switch {
	case err == nil:
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "status deleted successfully"})
	case errors.Is(err, service.ErrUserNotFound):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusNotFound)
	default:
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
	}
}
