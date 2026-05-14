package mongorepository

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"github.com/Leonid-Yakovlev63/cozy-chat/internal/domain"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/repository"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type userRepository struct {
	collection *mongo.Collection
}

func NewUserRepository(db *mongo.Database) repository.UserRepository {
	return &userRepository{
		collection: db.Collection("users"),
	}
}

func (r *userRepository) Create(ctx context.Context, user *domain.User) error {

	var userToCreate userDB = *toUserDB(user)

	userToCreate.ID = primitive.NewObjectID()
	userToCreate.CreatedAt = time.Now()
	userToCreate.UpdatedAt = time.Now()

	_, err := r.collection.InsertOne(ctx, userToCreate)
	if err != nil {
		slog.Error("Ошибка при добавлении пользователя")
		return err
	}
	return nil
}

func (r *userRepository) FindByUsername(ctx context.Context, username string) (*domain.User, error) {
	var user domain.User
	err := r.collection.FindOne(ctx, bson.M{"username": username}).Decode(&user)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	return &user, err
}
