package mongorepository

import (
	"context"
	"errors"
	"time"

	"github.com/Leonid-Yakovlev63/cozy-chat/internal/domain"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/repository"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type newsRepository struct {
	collection *mongo.Collection
}

func NewNewsRepository(db *mongo.Database) repository.NewsRepository {
	return &newsRepository{
		collection: db.Collection("news"),
	}
}

func (r *newsRepository) Create(ctx context.Context, news *domain.News) error {
	row := toNewsDB(news)
	row.ID = primitive.NewObjectID()
	now := time.Now()
	row.CreatedAt = now
	row.UpdatedAt = now

	_, err := r.collection.InsertOne(ctx, row)
	if err != nil {
		return err
	}

	news.ID = row.ID.Hex()
	news.CreatedAt = row.CreatedAt
	news.UpdatedAt = row.UpdatedAt
	return nil
}

func (r *newsRepository) FindAll(ctx context.Context) ([]domain.News, error) {
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cursor, err := r.collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var rows []newsDB
	if err := cursor.All(ctx, &rows); err != nil {
		return nil, err
	}

	items := make([]domain.News, 0, len(rows))
	for i := range rows {
		n := toDomainNews(&rows[i])
		items = append(items, *n)
	}
	return items, nil
}

func (r *newsRepository) FindByID(ctx context.Context, id string) (*domain.News, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, nil
	}

	var row newsDB
	err = r.collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&row)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return toDomainNews(&row), nil
}

func (r *newsRepository) Delete(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = r.collection.DeleteOne(ctx, bson.M{"_id": objectID})
	return err
}
