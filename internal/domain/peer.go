package domain

import "time"

// Peer — собеседник текущего пользователя (есть хотя бы одно сообщение в обе стороны).
type Peer struct {
	Username      string    `json:"username"`
	AvatarURL     string    `json:"avatarUrl,omitempty"`
	LastMessageAt time.Time `json:"lastMessageAt"`
}
