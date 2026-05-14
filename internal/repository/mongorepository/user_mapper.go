package mongorepository

import (
	"time"

	"github.com/Leonid-Yakovlev63/cozy-chat/internal/domain"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type userDB struct {
	ID        primitive.ObjectID `bson:"_id"`
	Username  string             `bson:"username" validate:"required,min=3"`
	Password  string             `bson:"password" validate:"required,min=8"`
	CreatedAt time.Time          `bson:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt"`
}

// Предполагается, что ID пустой, т.к. его создаст метод Create
func toUserDB(u *domain.User) *userDB {
	return &userDB{
		Username:  u.Username,
		Password:  u.Password,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

func toDomainUser(u *userDB) *domain.User {
	return &domain.User{
		ID:        u.ID.Hex(),
		Username:  u.Username,
		Password:  u.Password,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}
