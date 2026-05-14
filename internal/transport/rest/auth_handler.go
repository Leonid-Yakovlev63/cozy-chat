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
	AuthHandler interface {
		RegisterRoutes(mux *http.ServeMux)
		Login(w http.ResponseWriter, r *http.Request)
		Register(w http.ResponseWriter, r *http.Request)
	}
	authHandler struct {
		authService service.AuthService
		userService service.UserService
		validator   validator.Validator
	}
)

func NewAuthHandler(authService service.AuthService, userService service.UserService, validator validator.Validator) AuthHandler {
	return &authHandler{
		authService: authService,
		userService: userService,
		validator:   validator,
	}
}

func (h *authHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/register", h.Register)
	mux.HandleFunc("POST /api/login", h.Login)
}

func (h *authHandler) Register(w http.ResponseWriter, r *http.Request) {

	var req dto.RegisterRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request"}`, http.StatusBadRequest)
		return
	}

	if err := h.validator.Validate(req); err != nil {
		http.Error(w, `{"error":"validation failed: username must be >=3 chars, password >=8 chars"}`, http.StatusBadRequest)
		return
	}

	err := h.userService.Register(r.Context(), req.Username, req.Password)
	switch {
	case err == nil:
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message": "user registered successfully"})
	case errors.Is(err, service.ErrUserAlreadyExists):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusConflict)
	default:
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
	}
}

func (h *authHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request"}`, http.StatusBadRequest)
		return
	}

	token, err := h.authService.Login(r.Context(), req.Username, req.Password)
	switch {
	case err == nil:
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"token": token})
	case errors.Is(err, service.ErrUserNotFound), errors.Is(err, service.ErrInvalidPassword):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusUnauthorized)
	default:
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
	}
}
