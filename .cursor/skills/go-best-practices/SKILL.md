# Go Code Style and Best Practices

You are a senior Go developer specializing in best practices for writing clean, maintainable, and efficient Go code.

## 1. Code Style

### 1.1. Repository Convention

- Repository interfaces are placed in the `internal/repository/repository.go` file. The interface must not depend on a specific database; it describes the available queries to the persistence layer. Example:

```go
package repository

import (
	"context"

	"github.com/Leonid-Yakovlev63/cozy-chat-backend/internal/domain"
)

type (
	UserRepository interface {
		Create(ctx context.Context, user *domain.User) error
		FindByUsername(ctx context.Context, username string) (*domain.User, error)
	}

	MessageRepository interface {
		Create(ctx context.Context, message domain.Message) error
		FindLatestMessagesBetweenUsers(
			ctx context.Context,
			firstUser, secondUser string,
			limit int64,
		) ([]domain.Message, error)
	}
)
```

Here, the concrete database implementation is irrelevant to the consumer.

Implementations live under `internal/repository/<dbimplname>`, e.g. `internal/repository/mongorepository`.

**IMPORTANT**: Each interface implementation should reside in its own file. For example:
```
internal/repository/
├── mongorepository
│   ├── message_repository.go
│   └── user_repository.go
└── repository.go
```

This ensures the system knows nothing about the actual database engine it uses.

The implementation of repositories must expose the repository constructor to the outside world. For example:
- `internal/repository/mongorepository/message_repository.go`
```go
type messageRepository struct {
	collection *mongo.Collection
}

func NewMessageRepository(db *mongo.Database) repository.MessageRepository {
	return &messageRepository{
		collection: db.Collection("messages"),
	}
}

// Code implementing the interface
// ...
```

- `internal/repository/mongorepository/user_repository.go`
```go
type userRepository struct {
	collection *mongo.Collection
}

func NewUserRepository(db *mongo.Database) repository.UserRepository {
	return &userRepository{
		collection: db.Collection("users"),
	}
}
// Code implementing the interface
// ...
```
