package domain

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Message struct {
	ID        primitive.ObjectID `json:"id" bson:"_id"`
	FromUser  string             `json:"fromUser" bson:"fromUser"`
	ToUser    string             `json:"toUser" bson:"toUser"`
	Content   string             `json:"content" bson:"content"`
	CreatedAt time.Time          `json:"createdAt" bson:"createdAt"`
	IsRead    bool               `json:"isRead" bson:"isRead"`
	IsEdited  bool               `json:"isEdited" bson:"isEdited"`
}

func NewMessage(fromUser, toUser, content string) Message {
	return Message{
		ID:       primitive.NewObjectID(),
		FromUser: fromUser,
		ToUser:   toUser,
		Content:  content,

		CreatedAt: time.Now(),
		IsRead:    false,
		IsEdited:  false,
	}
}
