package domain

import (
	"time"
)

type Message struct {
	ID        string    `json:"id"`
	FromUser  string    `json:"fromUser"`
	ToUser    string    `json:"toUser"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
	IsRead    bool      `json:"isRead"`
	IsEdited  bool      `json:"isEdited"`
}

func NewMessage(fromUser, toUser, content string) Message {
	return Message{
		FromUser: fromUser,
		ToUser:   toUser,
		Content:  content,

		CreatedAt: time.Now(),
		IsRead:    false,
		IsEdited:  false,
	}
}
