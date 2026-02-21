# CURRENT_STATE

## Статус: Активная разработка — погода интегрирована

## Что реализовано
- [x] Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui
- [x] **122 страницы** (17 маршрутов + 100 SSG страниц культур)
- [x] **PWA** — manifest.json, service worker, полный набор PNG-иконок (13 шт, включая maskable + apple-touch)
- [x] **SEO** — robots.txt, sitemap.xml (103 URL), metadata, h1/h2, OpenGraph, viewport
- [x] **Справочник 100 культур** — овощи, зелень, ягоды, бобовые, деревья, цветы, пряные травы
- [x] **Интересные факты** `/facts` — 25 фактов в 5 категориях, фильтрация, случайный факт
- [x] **Лендинг** — hero, 6 фич, CTA, footer, **Framer Motion анимации**
- [x] **Auth** — Google + Яндекс, `/auth/signin`, middleware
- [x] **Онбординг** — геолокация + карта (Leaflet), анализ региона, литературный отчёт
- [x] **Мой участок** `/garden` — CRUD растений + **вкладка «Грядки»** (CRUD, типы, фото, привязка растений)
- [x] **Календарь** `/calendar` — региональные рекомендации
- [x] **Справочник** `/guide` — 100 культур, поиск, отдельные страницы SSG
- [x] **Камера** `/camera` — фото-анализ через серверный `/api/ai/analyze`
- [x] **Подписка** `/subscribe` — полноценная страница
- [x] **Настройки** `/settings` — редактирование координат на карте, выход
- [x] **Погода** — WeatherAPI.com, серверный proxy `/api/weather`, виджет (компактный + полный), рекомендации для дачника
- [x] **API routes**: plants CRUD, beds CRUD, weather proxy, ai/analyze, payments (YooKassa), user/location, region/analyze
- [x] **React Query** — для plants, beds и серверного состояния
- [x] **Prisma + PostgreSQL** — 2 миграции, 10 таблиц
- [x] **Framer Motion** — анимации лендинга, переходы страниц, BottomNav layoutId, stagger-списки
- [x] **PNG-иконки PWA** — 13 иконок из SVG (sharp), manifest.json обновлён
- [x] **Vitest** — 50 тестов (9 файлов)
- [x] **Dockerfile** — multi-stage для TimeWeb

## Что НЕ реализовано
- [ ] Оффлайн-синхронизация (Background Sync, очередь задач)
- [ ] Push-уведомления
- [ ] AI-чат
- [ ] Мульти-нейросеть через сервер-интегратор (TBD)
- [ ] Галерея с sharing
- [ ] Загрузка фото грядок (API upload + хранение)

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

Без auth работают: лендинг (`/`), справочник (`/guide`, `/guide/[slug]`), интересные факты (`/facts`)
