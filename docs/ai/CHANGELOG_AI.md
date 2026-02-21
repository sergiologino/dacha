# CHANGELOG_AI

Лог изменений, внесённых AI-ассистентом.

---

## 2026-02-21 — PWA, Prisma CRUD, 100 культур, настройки, YooKassa

### PWA
- `manifest.json` с иконками, standalone mode, theme_color
- Service Worker (`sw.js`): stale-while-revalidate, кеш статики
- SVG-иконка приложения
- Viewport export (themeColor перенесён из metadata в viewport для Next.js 16)

### Data → Prisma
- API routes: `GET/POST/DELETE /api/plants` — CRUD растений через Prisma
- React Query хуки: `usePlants`, `useCreatePlant`, `useDeletePlant`
- Garden page переписан с localForage на React Query + Prisma
- React Query подключён в Providers (QueryClientProvider)

### Справочник 100 культур
- Расширен с 20 до 100: овощи, зелень, ягоды, бобовые, плодовые деревья, цветы, пряные травы
- 100 SSG-страниц (build: 119 страниц всего)

### Платежи
- `POST /api/payments` — YooKassa API (создание платежа, redirect)

### Настройки
- `/settings` — профиль, редактирование координат на карте, кнопка выхода
- Аватар в хедере ведёт на настройки
- Middleware обновлён для /settings

---

## 2026-02-21 — Онбординг с геолокацией и региональным анализом

### Функционал
- 4-шаговый онбординг: welcome → location → analyzing → report
- Геолокация: browser API + ручной выбор на карте (Leaflet + OpenStreetMap)
- Reverse geocoding через Nominatim (адрес по координатам)
- Анализ региона: климат, почвы, безморозный период, рекомендованные культуры
- Литературный отчёт (5 зон РФ) — красиво и информативно
- Приватность: объяснение зачем координаты, данные не передаются третьим лицам

### БД
- Миграция `add_user_geolocation`: поля latitude, longitude, locationName, regionReport, onboardingDone в users
- API routes: `POST /api/user/location`, `POST /api/region/analyze`

### UX
- Авторедирект из /garden на /onboarding для новых пользователей (useOnboardingCheck hook)
- На десктопе: карта для ручного выбора места участка
- На мобильном: кнопка автоопределения + карта меньшего размера

### Данные
- `lib/data/climate-zones.ts` — 5 климатических зон с описаниями
- Fallback для неизвестных координат

### Тесты
- 6 тестов для climate-zones (findClimateZone, getDefaultReport)
- Итого: 24 теста, все проходят. Build: 36 страниц.

---

## 2026-02-21 — Рефакторинг: многостраничная архитектура + SEO

### Маршрутизация
- Разбит монолит `page.tsx` (498 строк) на 8 отдельных маршрутов
- Route groups: `(app)/` для защищённых страниц с общим layout
- Публичный `/guide` с SSG (20 статических страниц культур)
- Кастомная `/auth/signin` с Google и Яндекс кнопками

### Компоненты
- Извлечены: `BottomNav`, `AppHeader`, `ThemeToggle`, `SubscribeModal`, `Providers`
- `BottomNav` теперь на Link (не state-based табы)
- Root layout серверный, клиентская логика вынесена в `Providers`

### SEO
- `robots.ts` — разрешает `/`, `/guide/*`; закрывает защищённые
- `sitemap.ts` — автоматически из массива crops (22 URL)
- Per-page metadata: title, description, keywords, OpenGraph
- Структурированные h1/h2 на каждой странице

### Безопасность
- Создан `/api/ai/analyze` — серверный proxy для YandexGPT
- API ключи больше не утекают на клиент (убран NEXT_PUBLIC_)
- `middleware.ts` + `authorized` callback для защиты маршрутов

### Данные
- Справочник расширен с 10 до 20 культур с описаниями и slug
- Данные вынесены в `lib/data/crops.ts`, типы в `lib/types.ts`

### Тесты
- Добавлены: BottomNav (3), crops data (6) — итого 18 тестов, все проходят
- Удалён мёртвый `app/temp.tsx`

### Build
- `npx next build` проходит: 33 страницы, SSG + SSR + API routes

---

## 2026-02-20 — Первая миграция PostgreSQL

- Подключена БД `dacha_db` на 82.97.242.40:5432
- Миграция `20260220214032_init` применена — все 10 таблиц созданы
- Prisma Client сгенерирован
- Решения зафиксированы: D-010 Яндекс.Погода, D-011 мульти-нейросеть через интегратор (TBD)

---

## 2026-02-20 — Инициализация инфраструктуры

### Конфигурации и инфраструктура
- Настроена **Prisma ORM** с PostgreSQL: схема с 10 моделями (User, Account, Session, VerificationToken, Crop, Bed, Plant, Photo, Analysis, TaskQueue, Payment)
- Создан `lib/prisma.ts` — singleton Prisma client
- Создан `Dockerfile` — multi-stage build (deps → build → runner) на node:22-alpine для TimeWeb
- Обновлён `next.config.ts` — включён standalone output для Docker
- Создан `.env.example` со всеми переменными
- Очищен `.env` от Prisma-дефолтного URL

### Тесты
- Настроен **Vitest** (`vitest.config.ts`, `vitest.setup.ts`) с jsdom и @testing-library/react
- Настроен **Playwright** (`playwright.config.ts`) с chromium + mobile-chrome
- Добавлены unit-тесты: `cn()` (5 тестов), `Button` компонент (4 теста) — все 9 проходят
- Добавлен E2E-тест лендинга

### Безопасность и gitignore
- `.idea/` добавлен в `.gitignore`
- `Идентификатор ключа.txt` добавлен в `.gitignore`
- `.env.example` НЕ игнорируется (шаблон для команды)
- Добавлены в `.gitignore`: test artifacts, prisma generated

### Добавлены npm scripts
- `test`, `test:watch`, `test:ui`, `test:coverage`, `test:e2e`
- `db:generate`, `db:migrate`, `db:push`, `db:studio`, `db:seed`

---

## 2026-02-20 — Инициализация AI-памяти

### Что сделано
- Проанализирован весь репозиторий
- Созданы файлы `docs/ai/`: PROJECT_OVERVIEW, ARCHITECTURE, CURRENT_STATE, DECISIONS, CONVENTIONS, CHANGELOG_AI
