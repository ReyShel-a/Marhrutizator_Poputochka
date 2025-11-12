# Rideshare Village Backend

Backend сервер для приложения совместных поездок.

## Структура проекта

```
backend/
├── src/
│   ├── config/          # Конфигурация (БД, миграции)
│   ├── middleware/      # Express middleware
│   ├── models/          # Модели данных и репозитории
│   ├── routes/          # API роуты
│   ├── types/           # TypeScript типы
│   ├── scripts/         # Скрипты (миграции)
│   └── index.ts         # Точка входа
├── .env.example         # Пример переменных окружения
└── package.json
```

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

3. Настройте переменные окружения в `.env`:
```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/rideshare_village
CORS_ORIGIN=http://localhost:5173
```

## База данных

### Требования
- PostgreSQL 12+
- PostGIS расширение

### Миграции

Запустите миграции для создания таблиц:
```bash
npm run migrate
```

Это создаст:
- Таблицу `routes` для маршрутов водителей
- Таблицу `bookings` для бронирований пассажиров
- Геопространственные индексы для быстрого поиска

## Запуск

### Development режим
```bash
npm run dev
```

### Production режим
```bash
npm run build
npm start
```

## API Endpoints

### Маршруты
- `POST /api/routes` - Создать маршрут
- `GET /api/routes/:id` - Получить маршрут
- `PUT /api/routes/:id` - Обновить маршрут
- `DELETE /api/routes/:id` - Удалить маршрут
- `GET /api/routes/search` - Поиск маршрутов
- `GET /api/routes/nearby` - Ближайшие маршруты

### Бронирования
- `POST /api/bookings` - Создать бронирование
- `GET /api/bookings/:id` - Получить бронирование
- `PUT /api/bookings/:id` - Обновить бронирование
- `DELETE /api/bookings/:id` - Отменить бронирование
- `GET /api/bookings/route/:routeId` - Бронирования маршрута

### QR-коды
- `GET /api/qr/:routeId` - Получить данные маршрута по QR

### Health Check
- `GET /health` - Проверка состояния сервера

## Реализованные компоненты

### Task 2.1: Express сервер
- ✅ Настроен Express с middleware (CORS, body-parser)
- ✅ Создан error handler для обработки ошибок
- ✅ Базовая структура роутов

### Task 2.2: PostgreSQL
- ✅ Подключение к PostgreSQL через pg
- ✅ Схема БД с таблицами routes и bookings
- ✅ Система миграций
- ✅ Геопространственные индексы с PostGIS

### Task 2.3: Модели и репозитории
- ✅ RouteModel с CRUD операциями
- ✅ BookingModel с CRUD операциями
- ✅ Геопространственный поиск маршрутов
- ✅ TypeScript типы для всех моделей
