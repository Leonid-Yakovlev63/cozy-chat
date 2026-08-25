package service

import "errors"

var (
	ErrUserAlreadyExists = errors.New("пользователь с таким именем уже существует")
	ErrUserNotFound      = errors.New("пользователь не найден")
	ErrInvalidPassword   = errors.New("неверный пароль")
	ErrInvalidStruct     = errors.New("ошибка валидации")
	ErrInvalidAvatarURL  = errors.New("некорректный URL аватара")

	ErrSendMessage               = errors.New("ошибка отправки сообщения")
	ErrFromUserEqualsToUser      = errors.New("нельзя отправить сообщение себе")
	ErrReadMessagesFromYourself  = errors.New("нельзя читать сообщения с самим собой")
	ErrInvalidMessagesPagination = errors.New("некорректная пагинация сообщений")
	ErrUserNotVerified           = errors.New("пользователь не верифицирован")
	ErrUserBlocked               = errors.New("пользователь заблокирован")
	ErrAccessDenied              = errors.New("доступ запрещён")
	ErrCannotBlockAdmin          = errors.New("нельзя заблокировать администратора")
	ErrNewsNotFound              = errors.New("новость не найдена")
	ErrReadSomeoneElsesCorrespondence = errors.New("чтение чужой переписки")
)
