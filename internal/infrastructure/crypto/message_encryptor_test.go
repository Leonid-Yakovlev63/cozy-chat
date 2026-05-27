package crypto

import "testing"

func TestMessageEncryptorRoundTrip(t *testing.T) {
	encryptor, err := NewMessageEncryptorFromSecret("test-secret-key")
	if err != nil {
		t.Fatalf("NewMessageEncryptorFromSecret: %v", err)
	}

	plaintext := "Привет, это секретное сообщение!"

	encrypted, err := encryptor.Encrypt(plaintext)
	if err != nil {
		t.Fatalf("Encrypt: %v", err)
	}

	if encrypted == plaintext {
		t.Fatal("ожидался зашифрованный текст, получен plaintext")
	}

	decrypted, err := encryptor.Decrypt(encrypted)
	if err != nil {
		t.Fatalf("Decrypt: %v", err)
	}

	if decrypted != plaintext {
		t.Fatalf("ожидался %q, получен %q", plaintext, decrypted)
	}
}

func TestMessageEncryptorLegacyPlaintext(t *testing.T) {
	encryptor, err := NewMessageEncryptorFromSecret("test-secret-key")
	if err != nil {
		t.Fatalf("NewMessageEncryptorFromSecret: %v", err)
	}

	legacy := "старое сообщение без шифрования"

	decrypted, err := encryptor.Decrypt(legacy)
	if err != nil {
		t.Fatalf("Decrypt legacy: %v", err)
	}

	if decrypted != legacy {
		t.Fatalf("ожидался %q, получен %q", legacy, decrypted)
	}
}
