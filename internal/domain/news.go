package domain

import "time"

type News struct {
	ID             string    `json:"id"`
	Title          string    `json:"title" validate:"required,min=1,max=200"`
	Content        string    `json:"content" validate:"required,min=1,max=10000"`
	AuthorUsername string    `json:"authorUsername"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}
