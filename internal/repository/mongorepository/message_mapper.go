package mongorepository

import (
	"time"

	"github.com/Leonid-Yakovlev63/cozy-chat/internal/domain"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/infrastructure/crypto"
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
func toMessageDB(m *domain.Message, encryptor crypto.MessageEncryptor) (*messageDB, error) {
	encryptedContent, err := encryptor.Encrypt(m.Content)
	if err != nil {
		return nil, err
	}

	return &messageDB{
		FromUser:  m.FromUser,
		ToUser:    m.ToUser,
		Content:   encryptedContent,
		CreatedAt: m.CreatedAt,
		IsRead:    m.IsRead,
		IsEdited:  m.IsEdited,
	}, nil
}

func toDomainMessage(m *messageDB, encryptor crypto.MessageEncryptor) (*domain.Message, error) {
	content, err := encryptor.Decrypt(m.Content)
	if err != nil {
		return nil, err
	}

	return &domain.Message{
		ID:        m.ID.Hex(),
		FromUser:  m.FromUser,
		ToUser:    m.ToUser,
		Content:   content,
		CreatedAt: m.CreatedAt,
		IsRead:    m.IsRead,
		IsEdited:  m.IsEdited,
	}, nil
}
