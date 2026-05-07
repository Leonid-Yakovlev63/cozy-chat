package rest

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/Leonid-Yakovlev63/cozy-chat-backend/internal/domain"
	"github.com/Leonid-Yakovlev63/cozy-chat-backend/internal/dto"
	"github.com/Leonid-Yakovlev63/cozy-chat-backend/internal/infrastructure/validator"
	"github.com/Leonid-Yakovlev63/cozy-chat-backend/internal/service"
)

type (
	MessageHandler interface {
		RegisterRoutes(mux *http.ServeMux)
		SendMessage(w http.ResponseWriter, r *http.Request)
	}
	messageHandler struct {
		authService    service.AuthService
		messageService service.MessageService
		validator      validator.Validator
	}
)

func NewMessageHandler(messageService service.MessageService, authService service.AuthService, validator validator.Validator) MessageHandler {
	return &messageHandler{messageService: messageService, authService: authService, validator: validator}
}

func (h *messageHandler) SendMessage(w http.ResponseWriter, r *http.Request) {

	username, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req dto.SendMessageRequestDto

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request"}`, http.StatusBadRequest)
		return
	}

	if err := h.validator.Validate(req); err != nil {
		http.Error(w, `{"error":"validation failed: toUser and content are required"}`, http.StatusBadRequest)
		return
	}

	var message domain.Message

	message = domain.NewMessage(username, req.ToUser, req.Content)

	err := h.messageService.SendMessage(r.Context(), message)
	switch {
	case err == nil:
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message": "message sent successfully"})
	case errors.Is(err, service.ErrFromUserEqualsToUser):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
	case errors.Is(err, service.ErrUserNotFound):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusNotFound)
	default:
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
	}
}

func (h *messageHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.Handle("POST /api/messages", AuthMiddleware(h.authService)(http.HandlerFunc(h.SendMessage)))
}
