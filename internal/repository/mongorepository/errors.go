package mongorepository

import "errors"

var (
	// Message Repository
	ErrMessageNotFound            = errors.New("message not found")
	ErrFailedToMarkMessagesAsRead = errors.New("failed to mark messages as read")
)
