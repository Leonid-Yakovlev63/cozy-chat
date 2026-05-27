package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"strings"
)

const encryptedContentPrefix = "enc:v1:"

type MessageEncryptor interface {
	Encrypt(plaintext string) (string, error)
	Decrypt(ciphertext string) (string, error)
}

type aesGCMMessageEncryptor struct {
	aead cipher.AEAD
}

func NewMessageEncryptorFromSecret(secret string) (MessageEncryptor, error) {
	if strings.TrimSpace(secret) == "" {
		return nil, errors.New("ключ шифрования сообщений не задан")
	}

	key := sha256.Sum256([]byte(secret))

	block, err := aes.NewCipher(key[:])
	if err != nil {
		return nil, fmt.Errorf("инициализация AES: %w", err)
	}

	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("инициализация GCM: %w", err)
	}

	return &aesGCMMessageEncryptor{aead: aead}, nil
}

func (e *aesGCMMessageEncryptor) Encrypt(plaintext string) (string, error) {
	nonce := make([]byte, e.aead.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("генерация nonce: %w", err)
	}

	ciphertext := e.aead.Seal(nonce, nonce, []byte(plaintext), nil)

	return encryptedContentPrefix + base64.StdEncoding.EncodeToString(ciphertext), nil
}

func (e *aesGCMMessageEncryptor) Decrypt(ciphertext string) (string, error) {
	if !strings.HasPrefix(ciphertext, encryptedContentPrefix) {
		return ciphertext, nil
	}

	payload, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(ciphertext, encryptedContentPrefix))
	if err != nil {
		return "", fmt.Errorf("декодирование ciphertext: %w", err)
	}

	nonceSize := e.aead.NonceSize()
	if len(payload) < nonceSize {
		return "", errors.New("некорректный ciphertext")
	}

	nonce, encrypted := payload[:nonceSize], payload[nonceSize:]
	plaintext, err := e.aead.Open(nil, nonce, encrypted, nil)
	if err != nil {
		return "", fmt.Errorf("расшифровка content: %w", err)
	}

	return string(plaintext), nil
}
