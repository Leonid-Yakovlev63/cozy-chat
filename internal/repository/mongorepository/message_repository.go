package mongorepository

import (
	"context"
	"log/slog"
	"time"

	"github.com/Leonid-Yakovlev63/cozy-chat/internal/domain"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/infrastructure/crypto"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/repository"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type messageRepository struct {
	collection *mongo.Collection
	encryptor  crypto.MessageEncryptor
}

func NewMessageRepository(db *mongo.Database, encryptor crypto.MessageEncryptor) repository.MessageRepository {
	return &messageRepository{
		collection: db.Collection("messages"),
		encryptor:  encryptor,
	}
}

func (r *messageRepository) Create(ctx context.Context, message domain.Message) error {

	messageDB, err := toMessageDB(&message, r.encryptor)
	if err != nil {
		slog.Error("Ошибка при шифровании content сообщения", "error", err)
		return err
	}

	messageDB.ID = primitive.NewObjectID()

	_, err = r.collection.InsertOne(ctx, messageDB)
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
	defer cursor.Close(ctx)

	var messagesDB []messageDB

	if err = cursor.All(ctx, &messagesDB); err != nil {
		slog.Error("Ошибка при чтении сообщений из MongoDB", "error", err)
		return nil, err
	}

	var messages []domain.Message

	for _, message := range messagesDB {
		domainMessage, err := toDomainMessage(&message, r.encryptor)
		if err != nil {
			slog.Error("Ошибка при расшифровке content сообщения", "error", err, "messageID", message.ID.Hex())
			return nil, err
		}

		messages = append(messages, *domainMessage)
	}

	return messages, nil

}

func (r *messageRepository) FindMessagesBetweenUsers(
	ctx context.Context,
	firstUser, secondUser string,
	limit, offset int64,
) ([]domain.Message, error) {
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

	findOptions := options.Find().
		SetLimit(limit).
		SetSkip(offset).
		SetSort(bson.D{{Key: "createdAt", Value: -1}})

	cursor, err := r.collection.Find(ctx, filter, findOptions)
	if err != nil {
		slog.Error("Ошибка при поиске сообщений между собеседниками", "error", err)
		return nil, err
	}
	defer cursor.Close(ctx)

	var messagesDB []messageDB

	if err = cursor.All(ctx, &messagesDB); err != nil {
		slog.Error("Ошибка при чтении сообщений из MongoDB", "error", err)
		return nil, err
	}

	messages := make([]domain.Message, 0, len(messagesDB))

	for _, message := range messagesDB {
		domainMessage, err := toDomainMessage(&message, r.encryptor)
		if err != nil {
			slog.Error("Ошибка при расшифровке content сообщения", "error", err, "messageID", message.ID.Hex())
			return nil, err
		}

		messages = append(messages, *domainMessage)
	}

	return messages, nil
}

type peerAggRow struct {
	Username      string    `bson:"username"`
	LastMessageAt time.Time `bson:"lastMessageAt"`
}

func (r *messageRepository) ListPeers(ctx context.Context, username string) ([]domain.Peer, error) {
	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: bson.M{
			"$or": []bson.M{
				{"fromUser": username},
				{"toUser": username},
			},
		}}},
		bson.D{{Key: "$addFields", Value: bson.M{
			"peer": bson.M{
				"$cond": bson.A{
					bson.M{"$eq": bson.A{"$fromUser", username}},
					"$toUser",
					"$fromUser",
				},
			},
		}}},
		bson.D{{Key: "$group", Value: bson.M{
			"_id":           "$peer",
			"lastMessageAt": bson.M{"$max": "$createdAt"},
		}}},
		bson.D{{Key: "$sort", Value: bson.D{{Key: "lastMessageAt", Value: -1}}}},
		bson.D{{Key: "$project", Value: bson.M{
			"_id":           0,
			"username":      "$_id",
			"lastMessageAt": 1,
		}}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		slog.Error("Ошибка при агрегации списка собеседников", "error", err)
		return nil, err
	}
	defer cursor.Close(ctx)

	var rows []peerAggRow
	if err = cursor.All(ctx, &rows); err != nil {
		slog.Error("Ошибка при чтении результата агрегации peers", "error", err)
		return nil, err
	}

	peers := make([]domain.Peer, 0, len(rows))
	for _, row := range rows {
		peers = append(peers, domain.Peer{
			Username:      row.Username,
			LastMessageAt: row.LastMessageAt,
		})
	}

	return peers, nil
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

func (r *messageRepository) DeleteByUsername(ctx context.Context, username string) error {
	_, err := r.collection.DeleteMany(ctx, bson.M{
		"$or": []bson.M{
			{"fromUser": username},
			{"toUser": username},
		},
	})
	return err
}
