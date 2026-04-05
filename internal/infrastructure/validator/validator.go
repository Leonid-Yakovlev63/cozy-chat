package validator

type Validator interface {
	Validate(i any) error
}
