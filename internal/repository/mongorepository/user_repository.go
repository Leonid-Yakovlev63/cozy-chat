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

	userToCreate.Verified = false
	userToCreate.Blocked = false
	userToCreate.Role = domain.RoleUser
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
	var row userDB
	err := r.collection.FindOne(ctx, bson.M{"username": username}).Decode(&row)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return toDomainUser(&row), nil
}

func (r *userRepository) FindUnverified(ctx context.Context) ([]domain.User, error) {
	cursor, err := r.collection.Find(ctx, bson.M{"verified": false, "blocked": bson.M{"$ne": true}})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var rows []userDB
	if err := cursor.All(ctx, &rows); err != nil {
		return nil, err
	}

	users := make([]domain.User, 0, len(rows))
	for i := range rows {
		u := toDomainUser(&rows[i])
		users = append(users, *u)
	}
	return users, nil
}

func (r *userRepository) SetBlocked(ctx context.Context, username string, blocked bool) error {
	_, err := r.collection.UpdateOne(ctx, bson.M{"username": username}, bson.M{
		"$set": bson.M{
			"blocked":   blocked,
			"updatedAt": time.Now(),
		},
	})
	return err
}

func (r *userRepository) SetVerified(ctx context.Context, username string, verified bool) error {
	_, err := r.collection.UpdateOne(ctx, bson.M{"username": username}, bson.M{
		"$set": bson.M{
			"verified":  verified,
			"updatedAt": time.Now(),
		},
	})
	return err
}

func (r *userRepository) ChangeStatus(ctx context.Context, username, status string) error {
	now := time.Now()
	_, err := r.collection.UpdateOne(ctx, bson.M{"username": username}, bson.M{
		"$set": bson.M{
			"status":    status,
			"updatedAt": now,
		},
	})
	if err != nil {
		return err
	}
	return nil
}

func (r *userRepository) DeleteStatus(ctx context.Context, username string) error {
	_, err := r.collection.UpdateOne(ctx, bson.M{"username": username}, bson.M{
		"$set": bson.M{
			"status":    "",
			"updatedAt": time.Now(),
		},
	})
	if err != nil {
		return err
	}
	return nil
}
