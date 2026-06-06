package service

import "errors"

var (
	ErrUserAlreadyExists = errors.New("user with this username is already exists")
	ErrUserNotFound      = errors.New("user not found")
	ErrInvalidPassword   = errors.New("invalid password")
	ErrInvalidStruct     = errors.New("validation error")

	ErrSendMessage              = errors.New("error sending message")
	ErrFromUserEqualsToUser     = errors.New("you cannot send a message to yourself")
	ErrReadMessagesFromYourself = errors.New("you cannot read a messages from yourself")
	ErrUserNotVerified          = errors.New("пользователь не верифицирован")
	ErrUserBlocked              = errors.New("пользователь заблокирован")
	ErrAccessDenied             = errors.New("access denied")
	// ???
	ErrReadSomeoneElsesCorrespondence = errors.New("reading someone else's correspondence")
)
