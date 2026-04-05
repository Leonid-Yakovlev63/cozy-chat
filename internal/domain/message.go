package domain

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Message struct {
	Id         primitive.ObjectID `json:"id" bson:"_id"`
	FromUserId primitive.ObjectID `json:"fromUserId" bson:"fromUserId"`
	ToUserId   primitive.ObjectID `json:"toUserId" bson:"toUserId"`
	Content    string             `json:"content" bson:"content"`
	CreatedAt  time.Time          `json:"createdAt" bson:"createdAt"`
	IsRead     bool               `json:"isRead" bson:"isRead"`
	IsEdited   bool               `json:"isEdited" bson:"isEdited"`
}
