package rest

import (
	"context"
	"net/http"
	"strings"

	"github.com/Leonid-Yakovlev63/cozy-chat/internal/domain"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/service"
)

type contextKey string

const UserContextKey contextKey = "user"

func AdminMiddleware(authService service.AuthService, userService service.UserService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return AuthMiddleware(authService)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			username, ok := r.Context().Value(UserContextKey).(string)
			if !ok {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			user, err := userService.GetUserByUsername(r.Context(), username)
			if err != nil || user == nil {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			if user.Role != domain.RoleAdmin {
				http.Error(w, `{"error":"access denied"}`, http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		}))
	}
}

func AuthMiddleware(authService service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, `{"error":"missing authorization header"}`, http.StatusUnauthorized)
				return
			}
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				http.Error(w, `{"error":"invalid authorization header"}`, http.StatusUnauthorized)
				return
			}
			tokenString := parts[1]
			claims, err := authService.ValidateToken(tokenString)
			if err != nil {
				http.Error(w, `{"error":"invalid or expired token"}`, http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), UserContextKey, claims.Subject)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
