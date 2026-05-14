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
		GetMyProfile(w http.ResponseWriter, r *http.Request)
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
	mux.Handle("GET /api/users/me", AuthMiddleware(h.authService)(http.HandlerFunc(h.GetMyProfile)))
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
