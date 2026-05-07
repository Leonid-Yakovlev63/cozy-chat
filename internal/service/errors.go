package service

import "errors"

var (
	ErrUserAlreadyExists = errors.New("user with this username is already exists")
	ErrUserNotFound      = errors.New("user not found")
	ErrInvalidPassword   = errors.New("invalid password")
	ErrInvalidStruct     = errors.New("validation error")

	ErrSentMessage          = errors.New("error sending message")
	ErrFromUserEqualsToUser = errors.New("you cannot send a message to yourself")
)
