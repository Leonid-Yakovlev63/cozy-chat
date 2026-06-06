package mongorepository

import (
	"time"

	"github.com/Leonid-Yakovlev63/cozy-chat/internal/domain"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type newsDB struct {
	ID             primitive.ObjectID `bson:"_id"`
	Title          string             `bson:"title"`
	Content        string             `bson:"content"`
	AuthorUsername string             `bson:"authorUsername"`
	CreatedAt      time.Time          `bson:"createdAt"`
	UpdatedAt      time.Time          `bson:"updatedAt"`
}

func toNewsDB(n *domain.News) *newsDB {
	return &newsDB{
		Title:          n.Title,
		Content:        n.Content,
		AuthorUsername: n.AuthorUsername,
		CreatedAt:      n.CreatedAt,
		UpdatedAt:      n.UpdatedAt,
	}
}

func toDomainNews(n *newsDB) *domain.News {
	return &domain.News{
		ID:             n.ID.Hex(),
		Title:          n.Title,
		Content:        n.Content,
		AuthorUsername: n.AuthorUsername,
		CreatedAt:      n.CreatedAt,
		UpdatedAt:      n.UpdatedAt,
	}
}
