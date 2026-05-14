package mongorepository

import (
	"time"

	"github.com/Leonid-Yakovlev63/cozy-chat/internal/domain"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type messageDB struct {
	ID        primitive.ObjectID `bson:"_id"`
	FromUser  string             `bson:"fromUser"`
	ToUser    string             `bson:"toUser"`
	Content   string             `bson:"content"`
	CreatedAt time.Time          `bson:"createdAt"`
	IsRead    bool               `bson:"isRead"`
	IsEdited  bool               `bson:"isEdited"`
}

// Предполагается, что ID пустой, т.к. его создаст метод Create
func toMessageDB(m *domain.Message) *messageDB {
	return &messageDB{
		FromUser:  m.FromUser,
		ToUser:    m.ToUser,
		Content:   m.Content,
		CreatedAt: m.CreatedAt,
		IsRead:    m.IsRead,
		IsEdited:  m.IsEdited,
	}
}

func toDomainMessage(m *messageDB) *domain.Message {
	return &domain.Message{
		ID:        m.ID.Hex(),
		FromUser:  m.FromUser,
		ToUser:    m.ToUser,
		Content:   m.Content,
		CreatedAt: m.CreatedAt,
		IsRead:    m.IsRead,
		IsEdited:  m.IsEdited,
	}
}
