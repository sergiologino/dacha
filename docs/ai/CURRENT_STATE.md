# CURRENT_STATE

## Статус: Готов к визуальному тестированию

## Что реализовано
- [x] Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui
- [x] **119 страниц** (14 маршрутов + 100 SSG страниц культур)
- [x] **PWA** — manifest.json, service worker (stale-while-revalidate), SVG-иконка
- [x] **SEO** — robots.txt, sitemap.xml (102 URL), metadata, h1/h2, OpenGraph, viewport
- [x] **Справочник 100 культур** — овощи, зелень, ягоды, бобовые, деревья, цветы, пряные травы
- [x] **Лендинг** — hero, 6 фич, CTA, footer
- [x] **Auth** — Google + Яндекс, `/auth/signin`, middleware
- [x] **Онбординг** — геолокация + карта (Leaflet), анализ региона, литературный отчёт
- [x] **Мой участок** `/garden` — CRUD через Prisma API + React Query
- [x] **Календарь** `/calendar` — региональные рекомендации
- [x] **Справочник** `/guide` — 100 культур, поиск, отдельные страницы SSG
- [x] **Камера** `/camera` — фото-анализ через серверный `/api/ai/analyze`
- [x] **Подписка** `/subscribe` — полноценная страница
- [x] **Настройки** `/settings` — редактирование координат на карте, выход
- [x] **API routes**: plants CRUD, ai/analyze, payments (YooKassa), user/location, region/analyze
- [x] **React Query** — для plants и серверного состояния
- [x] **Prisma + PostgreSQL** — 2 миграции, 10 таблиц
- [x] **Vitest** — 24 теста
- [x] **Dockerfile** — multi-stage для TimeWeb

## Что НЕ реализовано
- [ ] Оффлайн-синхронизация (Background Sync, очередь задач)
- [ ] Погодная интеграция (Яндекс.Погода API) — нужен API key
- [ ] Push-уведомления
- [ ] AI-чат
- [ ] Мульти-нейросеть через сервер-интегратор (TBD)
- [ ] Грядки с фото
- [ ] Галерея с sharing
- [ ] Лендинг с дачным пейзажем/иллюстрацией
- [ ] Анимации (Framer Motion + Lottie)
- [ ] Раздел «Интересные факты»
- [ ] PNG-иконки для PWA (сейчас SVG-placeholder)

## Для запуска
```bash
npm run dev
```
Откройте http://localhost:3000

## Env vars для работы auth
Для полного теста с авторизацией нужны ключи в `.env`:
- `AUTH_SECRET` — `openssl rand -base64 32`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- `AUTH_YANDEX_ID` / `AUTH_YANDEX_SECRET`

Без auth работают: лендинг (`/`), справочник (`/guide`, `/guide/[slug]`)
