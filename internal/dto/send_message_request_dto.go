package dto

type SendMessageRequestDto struct {
	ToUser  string `json:"toUser"  validate:"required"`
	Content string `json:"content"  validate:"required"`
}
