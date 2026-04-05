package service

import "errors"

var (
	ErrUserAlreadyExists = errors.New("пользователь с данным username уже зарегестрирован")
	ErrUserNotFound      = errors.New("пользователь не найден")
	ErrInvalidPassword   = errors.New("неправильный пароль")
	ErrInvalidStruct     = errors.New("ошибка валидации")
)
