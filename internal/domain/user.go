package domain

import (
	"time"
)

type Role string

const (
	RoleUser  Role = "user"
	RoleAdmin Role = "admin"
)

type User struct {
	ID        string    `json:"id"`
	Username  string    `json:"username" validate:"required,min=3"`
	Password  string    `json:"-" validate:"required,min=8"`
	Status    string    `json:"status" validate:"omitempty,min=1,max=500"`
	AvatarURL string    `json:"avatarUrl" validate:"omitempty,max=2048"`
	Verified  bool      `json:"verified" validate:"omitempty,boolean"`
	Blocked   bool      `json:"blocked" validate:"omitempty,boolean"`
	Role      Role      `json:"role" validate:"omitempty,oneof=user admin"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
