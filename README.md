# Cozy Chat

## Флаги приложения

Включить раздачу HTML и статики
```bash
go run .\cmd\app\main.go --enable-web
```

### Документы разработки

#### Частые проблемы

##### Windows

Освобождение порта 8080
```sh
netstat -ano | findstr :8080

taskkill /PID <PID> /F
```
