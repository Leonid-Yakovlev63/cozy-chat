package jwt

import (
	"errors"
	"time"

	jwtlib "github.com/golang-jwt/jwt/v5"
)

type hmacTokenProvider struct {
	secret     []byte
	expiration time.Duration
}

func NewHMACTokenProvider(secret string, expiration time.Duration) TokenProvider {
	return &hmacTokenProvider{
		secret:     []byte(secret),
		expiration: expiration,
	}
}

func (p *hmacTokenProvider) Generate(subject string) (string, error) {
	token := jwtlib.NewWithClaims(jwtlib.SigningMethodHS256, jwtlib.RegisteredClaims{
		Subject:   subject,
		ExpiresAt: jwtlib.NewNumericDate(time.Now().Add(p.expiration)),
		IssuedAt:  jwtlib.NewNumericDate(time.Now()),
	})
	return token.SignedString(p.secret)
}

func (p *hmacTokenProvider) Validate(tokenString string) (*Claims, error) {
	token, err := jwtlib.ParseWithClaims(tokenString, &jwtlib.RegisteredClaims{}, func(token *jwtlib.Token) (any, error) {
		if _, ok := token.Method.(*jwtlib.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return p.secret, nil
	})
	if err != nil {
		return nil, err
	}

	registeredClaims, ok := token.Claims.(*jwtlib.RegisteredClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return &Claims{Subject: registeredClaims.Subject}, nil
}
