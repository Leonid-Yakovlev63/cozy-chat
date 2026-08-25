package dto

type ChangeAvatarRequestDto struct {
	AvatarURL string `json:"avatarUrl" validate:"required,max=2048"`
}
