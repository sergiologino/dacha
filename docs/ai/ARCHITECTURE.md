# ARCHITECTURE

## Стек технологий
| Слой | Технология | Версия |
|------|-----------|--------|
| Framework | Next.js | 16.1.6 |
| UI Library | React | 19.2.3 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS v4 | ^4 |
| UI Components | shadcn/ui (new-york) | via radix-ui ^1.4.3 |
| Icons | lucide-react | ^0.574.0 |
| Auth | NextAuth v5 beta | ^5.0.0-beta.30 |
| ORM | Prisma | ^6.5.0 (client 6.19.2) |
| Database | PostgreSQL | 82.97.242.40:5432/dacha_db |
| Local Storage | localForage | ^1.10.0 |
| Date | date-fns | ^4.1.0 |
| State | @tanstack/react-query | ^5.90.21 |
| Animation | framer-motion | ^12 |
| Toasts | sonner | ^2.0.7 |
| Theme | next-themes | ^0.4.6 |
| AI | AI Integration Service | мульти-нейросеть (GPT-4o/mini/5, GigaChat, Pollinations, Whisper) |
| Weather | WeatherAPI.com | free tier (1M calls/mo) |
| Payments | YooKassa | 199₽/мес, 1990₽/год |
| Unit Tests | Vitest + React Testing Library | ^3.1.0 / ^16.3.0 |
| E2E Tests | Playwright | ^1.52.0 |
| Deploy | Docker → TimeWeb app-server | node:22-alpine |

## Маршруты (App Router)
```
app/
├── page.tsx                         # Лендинг (SSR, SEO, public)
├── layout.tsx                       # Root layout (серверный + Providers)
├── robots.ts                        # robots.txt
├── sitemap.ts                       # sitemap.xml (авто из crops)
├── (app)/                           # Защищённая группа (middleware)
│   ├── layout.tsx                   # AppHeader + BottomNav + gradient bg
│   ├── garden/page.tsx              # Мой участок
│   ├── calendar/page.tsx            # Календарь
│   ├── camera/page.tsx              # Фото-анализ
│   └── subscribe/page.tsx           # Подписка Премиум
├── guide/                           # Публичный справочник (SEO)
│   ├── page.tsx                     # Список культур (SSR)
│   ├── guide-search.tsx             # Клиентский поиск
│   └── [slug]/crop-detail.tsx       # Страница культуры (SSG, 100 страниц)
├── facts/                           # Интересные факты (public, SEO)
│   ├── page.tsx                     # Серверная обёртка
│   └── facts-content.tsx           # Клиентский контент с фильтрацией
├── auth/signin/                     # Вход
│   ├── page.tsx                     # Серверная обёртка
│   └── signin-form.tsx              # Клиентская форма (Google/Яндекс)
└── api/
    ├── auth/[...nextauth]/route.ts  # NextAuth API
    ├── plants/route.ts              # Plants CRUD (GET+POST+DELETE)
    ├── beds/route.ts                # Beds CRUD (GET+POST+DELETE)
    ├── weather/route.ts             # WeatherAPI.com proxy (3-day forecast + alerts)
    ├── ai/analyze/route.ts          # GPT-4o Vision анализ фото (через AI Integration)
    ├── ai/networks/route.ts         # Список доступных нейросетей
    ├── chat/route.ts                # AI-чат (через AI Integration)
    ├── chat/history/route.ts        # История чата
    ├── guide/detail/route.ts        # AI-подробности культуры (кеш CropGuide)
    ├── user/location/route.ts       # Координаты пользователя
    ├── user/premium/route.ts        # Статус премиума
    ├── region/analyze/route.ts      # Анализ региона (онбординг)
    ├── payments/route.ts            # YooKassa (создание платежа)
    ├── share/route.ts               # Шаринг
    └── health/route.ts              # Health check
```

## Компоненты
```
components/
├── providers.tsx              # ThemeProvider + SessionProvider + Toaster
├── app-header.tsx             # Header для (app) layout
├── bottom-nav.tsx             # Нижняя навигация (Link-based)
├── theme-toggle.tsx           # Переключатель темы
├── subscribe-modal.tsx        # Модал подписки
├── motion.tsx                 # Framer Motion обёртки (MotionDiv, StaggerContainer, PageTransition)
├── weather-widget.tsx         # Виджет погоды (compact + full, прогноз, алерты, рекомендации)
└── ui/                        # shadcn компоненты
    ├── avatar.tsx, badge.tsx, button.tsx, card.tsx
    ├── dialog.tsx, separator.tsx, sheet.tsx, sonner.tsx
```

## Данные
```
lib/
├── prisma.ts                  # Prisma client singleton
├── types.ts                   # Общие типы (Plant, Crop, Analysis)
├── utils.ts                   # cn()
├── data/crops.ts              # 100 культур + регионы (hardcoded)
├── data/fun-facts.ts          # 25 интересных фактов (5 категорий)
├── data/climate-zones.ts      # 5 климатических зон РФ
├── hooks/use-plants.ts        # React Query хуки для растений
├── hooks/use-beds.ts          # React Query хуки для грядок
├── hooks/use-weather.ts           # React Query хук для погоды
├── hooks/use-user-location.ts     # React Query хук для координат пользователя
├── hooks/use-onboarding-check.ts  # Проверка прохождения онбординга
├── hooks/use-chat.ts              # Хук AI-чата (состояние, отправка, очистка)
├── hooks/use-ai-networks.ts       # React Query хук для списка нейросетей
├── weather-tips.ts                # Генерация рекомендаций по погоде
└── generated/prisma/          # Prisma generated (gitignored)
```

## Auth
- Провайдеры: Google, Yandex
- Middleware: `middleware.ts` → защищает /garden, /calendar, /chat, /camera, /subscribe
- Callback `authorized` в auth.ts
- Кастомная страница: `/auth/signin`

## Database
- PostgreSQL на 82.97.242.40:5432 (dacha_db)
- Prisma ORM, миграция `init` применена
- Таблицы: users, accounts, sessions, verification_tokens, crops, beds, plants, photos, analyses, task_queue, payments, crop_guides (кеш AI-руководств)

## AI
- **AI Integration Service** — внешний сервис-интегратор нейросетей (Spring Boot)
- Доступ по `X-API-Key`, ключ хранится в `AI_INTEGRATION_API_KEY`
- Доступные сети (10): GPT-4o, GPT-4o-mini, GPT-4, GPT-5-mini, GigaChat, DALL·E 3, gpt-image-1.5, Pollinations (free), Whisper, Runway Gen-3
- `/api/chat` — AI-чат (GPT-4o-mini по умолчанию, system prompt «AI-агроном»)
- `/api/ai/analyze` — анализ фото растений через GPT-4o Vision
- `/api/ai/networks` — список доступных chat-сетей для UI
- YandexGPT Lite/Pro зарегистрированы (inactive, нужен API ключ Яндекса)

## SEO
- `robots.ts` → разрешает `/`, `/guide/*`; закрывает защищённые маршруты
- `sitemap.ts` → лендинг + справочник + все страницы культур
- Per-page metadata: title, description, keywords, OpenGraph
- h1/h2 структура на каждой странице
- SSG для справочника (100 статических страниц культур)

## Тесты
- 54 unit/component тестов (Vitest): utils, crops, climate-zones, fun-facts, weather-tips, beds-api, chat, Button, BottomNav, motion
- E2E: Playwright конфиг + тест лендинга
