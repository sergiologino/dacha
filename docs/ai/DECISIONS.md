# DECISIONS

Лог архитектурных и технических решений.

## D-001: Next.js 16 + React 19
- **Контекст**: Выбран новейший стек
- **Решение**: Next.js 16.1.6 с React 19.2.3
- **Причина**: App Router, Server Components, встроенная оптимизация

## D-002: Auth — NextAuth v5 beta
- **Контекст**: Нужна авторизация через Google и Яндекс
- **Решение**: next-auth ^5.0.0-beta.30
- **Причина**: Нативная поддержка App Router, провайдер Yandex из коробки

## D-003: UI — shadcn/ui (new-york style)
- **Контекст**: Нужна компонентная библиотека
- **Решение**: shadcn/ui поверх Radix UI + Tailwind CSS v4
- **Причина**: Кастомизируемые компоненты, копируются в проект

## D-004: Локальное хранение — localForage
- **Контекст**: Offline-first, данные должны сохраняться без интернета
- **Решение**: localForage для персистентного хранения на клиенте
- **Причина**: Абстракция над IndexedDB/WebSQL/localStorage

## D-005: AI — AI Integration Service + GPT-4o Vision
- **Контекст**: Анализ фото растений + AI-чат для дачников
- **Решение**: AI Integration Service (внешний Spring Boot сервис) вместо прямого YandexGPT
- **Причина**: Единый доступ к 10+ нейросетям, fallback между провайдерами, централизованное управление лимитами и ключами
- **Анализ фото**: GPT-4o Vision через integration service (base64 image в payload)
- **AI-чат**: GPT-4o-mini (по умолчанию), system prompt «AI-агроном ДачаAI»

## D-006: Платежи — YooKassa
- **Контекст**: Подписка Премиум
- **Решение**: YooKassa (199₽/мес, 1990₽/год)
- **Статус**: Не реализовано, только UI модал

## D-007: БД — PostgreSQL + Prisma ORM
- **Контекст**: Нужна серверная БД для синхронизации offline↔server
- **Решение**: PostgreSQL на отдельном сервере, Prisma ORM с миграциями
- **Причина**: Prisma — лучший DX для TypeScript (type-safe queries, автогенерация типов, встроенные миграции). PostgreSQL — надёжность, масштабируемость, JSON-поддержка
- **Схема**: `prisma/schema.prisma` — модели User, Account, Session, Crop, Bed, Plant, Photo, Analysis, TaskQueue, Payment

## D-008: Деплой — Docker + TimeWeb app-server
- **Контекст**: Нужен продакшн-деплой
- **Решение**: Multi-stage Dockerfile, Next.js standalone output, node:22-alpine
- **Причина**: TimeWeb app-server поддерживает Docker, standalone output минимизирует размер образа

## D-009: Тесты — Vitest + React Testing Library + Playwright
- **Контекст**: Нужны автотесты на всех уровнях
- **Решение**: Vitest (unit/integration) + @testing-library/react (компоненты) + Playwright (E2E)
- **Причина**: Vitest — быстрый, нативный ESM, совместим с Vite/React. Playwright — кросс-браузерный E2E, поддержка мобильных viewport

## D-010: Погода — WeatherAPI.com
- **Контекст**: Нужны прогнозы для рекомендаций (закрыть теплицу, полив)
- **Решение**: WeatherAPI.com (вместо Яндекс.Погода — платный)
- **Причина**: 1M запросов/мес бесплатно (vs 30K у OpenWeatherMap), 3-дневной прогноз, алерты, AQI, глобальное покрытие включая РФ, русская локализация
- **Env**: `WEATHER_API_KEY`
- **Архитектура**: серверный proxy `/api/weather` (ключ не на клиенте), кеш 30 мин (revalidate), `weather-tips.ts` генерирует рекомендации для дачника

## D-011: AI Integration Service — мульти-нейросеть
- **Контекст**: Нужен доступ к нескольким нейросетям через единый API
- **Решение**: AI Integration Service (Spring Boot) на `sergiologino-zettelkastenapp-ai-integration-bce3.twc1.net`
- **Аутентификация**: `X-API-Key` header, клиент `dacha-ai-app`
- **Доступные сети (10)**: GPT-4o (vision), GPT-4o-mini (fast chat), GPT-4, GPT-5-mini, GigaChat (SSL issues), DALL·E 3, gpt-image-1.5, Pollinations Lite (free), Whisper, Runway Gen-3 Alpha
- **Зарегистрированы, inactive**: YandexGPT Lite, YandexGPT Pro (нужен API ключ Яндекса)
- **Env**: `AI_INTEGRATION_URL`, `AI_INTEGRATION_API_KEY`
- **Архитектура**: серверные proxy routes `/api/chat` и `/api/ai/analyze` — ключи не на клиенте

## D-012: Карта — Leaflet + OpenStreetMap
- **Контекст**: Онбординг — выбор местоположения участка на карте
- **Решение**: Leaflet + OpenStreetMap + Nominatim reverse geocoding
- **Причина**: Бесплатно, без API ключей, отличное покрытие РФ, лёгкий бандл

## D-013: Геолокация — однократная при регистрации
- **Контекст**: Нужны координаты для персонализации (погода, климат, почвы)
- **Решение**: Запрос при онбординге, сохранение в БД, возможность редактирования
- **Причина**: Не раздражает повторными запросами, точные рекомендации

## Открытые вопросы
- [ ] PWA стратегия: next-pwa? Serwist? Ручной SW?
- [ ] Активация YandexGPT в AI Integration Service (нужен API ключ Яндекс.Облака)
- [ ] GigaChat SSL-сертификат на сервере интегратора (PKIX path building failed)
