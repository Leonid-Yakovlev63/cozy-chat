package rest

import (
	"encoding/json"
	"net/http"

	"github.com/Leonid-Yakovlev63/cozy-chat-backend/internal/service"
)

type (
	DataHandler interface {
		RegisterRoutes(mux *http.ServeMux)
		Public(w http.ResponseWriter, r *http.Request)
		Private(w http.ResponseWriter, r *http.Request)
	}

	dataHandler struct {
		authService service.AuthService
	}
)

func NewDataHandler(authService service.AuthService) DataHandler {
	return &dataHandler{
		authService: authService,
	}
}

func (h *dataHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/public", h.Public)

	mux.Handle("GET /api/private", AuthMiddleware(h.authService)(http.HandlerFunc(h.Private)))
}

func (h *dataHandler) Public(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Публичный эндпоинт, доступен без JWT токена",
	})
}

func (h *dataHandler) Private(w http.ResponseWriter, r *http.Request) {
	username, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Приватный эндпоинт, доступен только с JWT токеном",
		"user":    username,
	})
}
