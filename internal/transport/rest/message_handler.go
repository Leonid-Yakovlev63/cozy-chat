package rest

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/Leonid-Yakovlev63/cozy-chat/internal/domain"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/dto"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/infrastructure/validator"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/service"
)

type (
	MessageHandler interface {
		RegisterRoutes(mux *http.ServeMux)
		SendMessage(w http.ResponseWriter, r *http.Request)
		ReadLatestMessagesFromUser(w http.ResponseWriter, r *http.Request)
		ReadMessagesFromUser(w http.ResponseWriter, r *http.Request)
		ListPeers(w http.ResponseWriter, r *http.Request)
	}
	messageHandler struct {
		authService    service.AuthService
		messageService service.MessageService
		validator      validator.Validator
	}
)

func NewMessageHandler(messageService service.MessageService, authService service.AuthService, validator validator.Validator) MessageHandler {
	return &messageHandler{
		messageService: messageService,
		authService:    authService,
		validator:      validator,
	}
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

	err := h.messageService.SendMessage(r.Context(), username, req.ToUser, req.Content)
	switch {
	case err == nil:
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message": "message sent successfully"})
	case errors.Is(err, service.ErrFromUserEqualsToUser):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
	case errors.Is(err, service.ErrUserNotFound):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusNotFound)
	case errors.Is(err, service.ErrAccessDenied):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusForbidden)
	default:
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
	}
}

func (h *messageHandler) ReadLatestMessagesFromUser(w http.ResponseWriter, r *http.Request) {

	username, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	targetUser := r.PathValue("username")
	if targetUser == "" {
		http.Error(w, `{"error":"username path parameter is required"}`, http.StatusBadRequest)
		return
	}

	messages, err := h.messageService.ReadLatestMessagesFromUser(r.Context(), username, targetUser)
	switch {
	case err == nil:
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(messages)
	case errors.Is(err, service.ErrUserNotFound):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusNotFound)
	case errors.Is(err, service.ErrReadMessagesFromYourself):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
	default:
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
	}

}

func (h *messageHandler) ReadMessagesFromUser(w http.ResponseWriter, r *http.Request) {
	username, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	targetUser := r.PathValue("username")
	if targetUser == "" {
		http.Error(w, `{"error":"username path parameter is required"}`, http.StatusBadRequest)
		return
	}

	limit, offset, err := ParseMessagesPagination(r)
	if err != nil {
		http.Error(w, `{"error":"invalid limit or offset"}`, http.StatusBadRequest)
		return
	}

	messages, err := h.messageService.ReadMessagesFromUser(r.Context(), username, targetUser, limit, offset)
	switch {
	case err == nil:
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(messages)
	case errors.Is(err, service.ErrUserNotFound):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusNotFound)
	case errors.Is(err, service.ErrReadMessagesFromYourself):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
	case errors.Is(err, service.ErrInvalidMessagesPagination):
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
	default:
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
	}
}

func (h *messageHandler) ListPeers(w http.ResponseWriter, r *http.Request) {
	username, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	peers, err := h.messageService.ListPeers(r.Context(), username)
	if err != nil {
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}
	if peers == nil {
		peers = []domain.Peer{}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(peers)
}

func (h *messageHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.Handle("POST /api/messages", AuthMiddleware(h.authService)(http.HandlerFunc(h.SendMessage)))
	mux.Handle("GET /api/messages/{username}/latest", AuthMiddleware(h.authService)(http.HandlerFunc(h.ReadLatestMessagesFromUser)))
	mux.Handle("GET /api/messages/{username}", AuthMiddleware(h.authService)(http.HandlerFunc(h.ReadMessagesFromUser)))
	mux.Handle("GET /api/peers", AuthMiddleware(h.authService)(http.HandlerFunc(h.ListPeers)))
}
