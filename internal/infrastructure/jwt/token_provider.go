package jwt

type Claims struct {
	Subject string
}

type TokenProvider interface {
	Generate(subject string) (string, error)
	Validate(tokenString string) (*Claims, error)
}
