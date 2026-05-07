package mongorepository

import (
	"context"
	"log/slog"

	"github.com/Leonid-Yakovlev63/cozy-chat-backend/internal/domain"
	"github.com/Leonid-Yakovlev63/cozy-chat-backend/internal/repository"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type messageRepository struct {
	collection *mongo.Collection
}

func NewMessageRepository(db *mongo.Database) repository.MessageRepository {
	return &messageRepository{
		collection: db.Collection("messages"),
	}
}

func (r *messageRepository) Create(ctx context.Context, message domain.Message) error {

	_, err := r.collection.InsertOne(ctx, message)
	if err != nil {
		slog.Error("Ошибка при добавлении сообщения")
		return err
	}

	return nil

}

func (r *messageRepository) FindLatestMessagesBetweenUsers(ctx context.Context, firstUser, secondUser string, limit int64) ([]domain.Message, error) {

	filter := bson.M{
		"$or": []bson.M{
			{
				"fromUser": firstUser,
				"toUser":   secondUser,
			},
			{
				"fromUser": secondUser,
				"toUser":   firstUser,
			},
		},
	}

	findOptionsLatest := options.Find().SetLimit(limit).SetSort(bson.D{{Key: "createdAt", Value: -1}})

	cursor, err := r.collection.Find(ctx, filter, findOptionsLatest)
	if err != nil {
		slog.Error("Ошибка при поиске сообщений между собеседниками")
		return nil, err
	}

	var messages []domain.Message

	if err = cursor.All(ctx, &messages); err != nil {
		slog.Error("Ошибка при чтении сообщений из MongoDB")
		return nil, err
	}

	return messages, nil

}
