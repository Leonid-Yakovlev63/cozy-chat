package domain

import (
	"time"
)

type User struct {
	ID        string    `json:"id"`
	Username  string    `json:"username" validate:"required,min=3"`
	Password  string    `json:"-" validate:"required,min=8"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
