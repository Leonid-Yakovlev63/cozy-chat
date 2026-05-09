package mongorepository

import (
	"context"
	"log/slog"

	"github.com/Leonid-Yakovlev63/cozy-chat-backend/internal/domain"
	"github.com/Leonid-Yakovlev63/cozy-chat-backend/internal/repository"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
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

	var messageDB messageDB = *toMessageDB(&message)
	messageDB.ID = primitive.NewObjectID()

	_, err := r.collection.InsertOne(ctx, messageDB)
	if err != nil {
		slog.Error("Ошибка при добавлении сообщения", "error", err)
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
		slog.Error("Ошибка при поиске сообщений между собеседниками", "error", err)
		return nil, err
	}

	var messagesDB []messageDB

	if err = cursor.All(ctx, &messagesDB); err != nil {
		slog.Error("Ошибка при чтении сообщений из MongoDB", "error", err)
		return nil, err
	}

	var messages []domain.Message

	for _, message := range messagesDB {
		messages = append(messages, *toDomainMessage(&message))
	}

	return messages, nil

}

func (r *messageRepository) MarkMessageAsRead(ctx context.Context, ID string) error {

	objID, err := primitive.ObjectIDFromHex(ID)
	if err != nil {
		return err
	}

	update := bson.M{
		"$set": bson.M{
			"isRead": true,
		},
	}

	result, err := r.collection.UpdateByID(ctx, objID, update)

	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrMessageNotFound
	}

	return nil
}

func (r *messageRepository) MarkMessagesAsRead(ctx context.Context, username, targetUser string) error {

	filter := bson.M{
		"fromUser": targetUser,
		"toUser":   username,
		"isRead":   false,
	}

	update := bson.M{
		"$set": bson.M{
			"isRead": true,
		},
	}

	_, err := r.collection.UpdateMany(ctx, filter, update)
	if err != nil {
		return ErrFailedToMarkMessagesAsRead
	}

	return nil
}
