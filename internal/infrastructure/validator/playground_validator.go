package validator

import (
	"github.com/go-playground/validator/v10"
)

type PlaygroundValidator struct {
	validate *validator.Validate
}

func NewPlaygroundValidator() Validator {
	v := validator.New()
	return &PlaygroundValidator{validate: v}
}

func (v *PlaygroundValidator) Validate(i any) error {
	return v.validate.Struct(i)
}
