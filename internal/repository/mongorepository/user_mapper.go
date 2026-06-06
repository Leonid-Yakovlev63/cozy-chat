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
	Status    string             `bson:"status"`
	Verified  bool               `bson:"verified"`
	Blocked   bool               `bson:"blocked"`
	Role      domain.Role        `bson:"role"`
	CreatedAt time.Time          `bson:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt"`
}

// Предполагается, что ID пустой, т.к. его создаст метод Create
func toUserDB(u *domain.User) *userDB {
	return &userDB{
		Username:  u.Username,
		Password:  u.Password,
		Status:    u.Status,
		Verified:  u.Verified,
		Blocked:   u.Blocked,
		Role:      u.Role,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

func toDomainUser(u *userDB) *domain.User {
	role := u.Role
	if role == "" {
		role = domain.RoleUser
	}
	return &domain.User{
		ID:        u.ID.Hex(),
		Username:  u.Username,
		Password:  u.Password,
		Status:    u.Status,
		Verified:  u.Verified,
		Blocked:   u.Blocked,
		Role:      role,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}
