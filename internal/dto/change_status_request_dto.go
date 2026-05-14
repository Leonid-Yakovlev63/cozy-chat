package dto

type ChangeStatusRequestDto struct {
	Status string `json:"status" validate:"required,min=1,max=500"`
}
