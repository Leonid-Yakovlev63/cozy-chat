package service

import (
	"regexp"
)

const avatarURLMaxLen = 2048

var avatarURLPattern = regexp.MustCompile(`^https?://[^\s<>"']+$`)

func validateAvatarURL(url string) error {
	if url == "" || len(url) > avatarURLMaxLen {
		return ErrInvalidAvatarURL
	}
	if !avatarURLPattern.MatchString(url) {
		return ErrInvalidAvatarURL
	}
	return nil
}
