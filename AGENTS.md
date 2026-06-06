# Cozy Chat Instructions for Agents

## Project Overview
Приложение Cozy Chat - это веб-приложение для чата, построенное на основе REST API и принципах чистой архитектуры.
- Golang
- MongoDB
- React

## Repository Layout
### Backend (`internal/`)
- `domain/` — сущности без внешних зависимостей
- `service/` — бизнес-логика
- `repository/` — интерфейс в `repository/repository.go`, реализация в `repository/mongorepository/`
- `transport/rest/` — HTTP handlers, middleware
- `infrastructure/` — адаптеры (crypto, validator)
- `dto/` — контракты запросов/ответов API
- `app/` — сборка зависимостей

### Frontend (`frontend/src/`)
- Feature-Sliced Design: `app`, `pages`, `widgets`, `features`, `entities`, `shared`
- API-клиент: `shared/api/client.ts`
- Стили: SCSS рядом с компонентом

## Backend Rules
- Внешние библиотеки — только через `infrastructure/`
- `errors.go` содержащий ошибки приложения должен находиться в том же слое, в котором он используется
- Repository interface — в `repository/repository.go`, без привязки к конкретной реализации
- Подробности Go — см. `.cursor/skills/go-best-practices/SKILL.md`

## General Rules
- Минимальный diff, без рефакторинга «заодно»
- Следовать существующим именам и паттернам
- Коммиты — только по явной просьбе пользователя
