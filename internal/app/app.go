package app

import (
	"context"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/Leonid-Yakovlev63/cozy-chat/internal/infrastructure/crypto"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/infrastructure/validator"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/repository/mongorepository"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/service"
	"github.com/Leonid-Yakovlev63/cozy-chat/internal/transport/rest"
	"github.com/joho/godotenv"
	httpSwagger "github.com/swaggo/http-swagger/v2"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func Run() {

	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Ошибка загрузки .env")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET не задан в .env")
	}

	messageEncryptionKey := os.Getenv("MESSAGE_ENCRYPTION_KEY")
	if messageEncryptionKey == "" {
		log.Fatal("MESSAGE_ENCRYPTION_KEY не задан в .env")
	}

	messageEncryptor, err := crypto.NewMessageEncryptorFromSecret(messageEncryptionKey)
	if err != nil {
		log.Fatalf("Ошибка инициализации шифрования сообщений: %v", err)
	}

	mongoDbHost := os.Getenv("MONGO_DB_HOST")
	if mongoDbHost == "" {
		log.Fatal("MONGO_DB_HOST не задан в .env")
	}
	mongoDbUser := os.Getenv("MONGO_DB_USER")
	if mongoDbUser == "" {
		log.Fatal("MONGO_DB_USER не задан в .env")
	}
	mongoDbPassword := os.Getenv("MONGO_DB_PASSWORD")
	if mongoDbPassword == "" {
		log.Fatal("MONGO_DB_PASSWORD не задан в .env")
	}
	mongoDbPort := os.Getenv("MONGO_DB_PORT")
	if mongoDbPort == "" {
		slog.Warn("Используется MONGO_DB_PORT по умолчанию: 27017")
		mongoDbPort = "27017"
	}

	// NixOS
	// mongoDbUri := fmt.Sprintf("mongodb://%s:%s@%s:%s/?authSource=chat", mongoDbUser, mongoDbPassword, mongoDbHost, mongoDbPort)

	// Windows
	mongoDbUri := fmt.Sprintf("mongodb://localhost:27017/?authSource=chat")

	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(mongoDbUri))
	if err != nil {
		log.Fatalf("Ошибка подключения к MongoDB: %v", err)
	}
	defer client.Disconnect(context.TODO())

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatalf("Неудачный пинг MongoDB: %v", err)
	}
	slog.Info("Успешное подключение к MongoDB")

	db := client.Database("chat")

	appValidator := validator.NewPlaygroundValidator()

	userRepository := mongorepository.NewUserRepository(db)
	messageRepository := mongorepository.NewMessageRepository(db, messageEncryptor)

	userService := service.NewUserService(userRepository, appValidator)
	authService := service.NewAuthService(userService, jwtSecret, 24)
	messageService := service.NewMessageService(messageRepository, userRepository)

	mux := http.NewServeMux()

	authHandler := rest.NewAuthHandler(authService, userService, appValidator)
	authHandler.RegisterRoutes(mux)

	dataHandler := rest.NewDataHandler(authService)
	dataHandler.RegisterRoutes(mux)

	messageHandler := rest.NewMessageHandler(messageService, authService, appValidator)
	messageHandler.RegisterRoutes(mux)

	userHandler := rest.NewUserHandler(userService, authService, appValidator)
	userHandler.RegisterRoutes(mux)

	adminHandler := rest.NewAdminHandler(userService, authService)
	adminHandler.RegisterRoutes(mux)

	// Swagger
	mux.HandleFunc("GET /openapi.yaml", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "openapi.yaml")
	})
	mux.Handle("GET /swagger/", httpSwagger.Handler(httpSwagger.URL("/openapi.yaml")))
	mux.HandleFunc("GET /swagger", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/swagger/", http.StatusMovedPermanently)
	})

	slog.Info("Старт приложения")
	slog.Info("Swagger: http://localhost:8080/swagger/")

	err = http.ListenAndServe(":8080", mux)
	if err != nil {
		panic(err)
	}

}
