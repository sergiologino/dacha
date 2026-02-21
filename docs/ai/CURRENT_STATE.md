# CURRENT_STATE

## Статус: Активная разработка — AI-интеграция завершена

## Что реализовано
- [x] Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui
- [x] **125 страниц** (18 маршрутов + 100 SSG страниц культур)
- [x] **PWA** — manifest.json, service worker, полный набор PNG-иконок (13 шт, включая maskable + apple-touch)
- [x] **SEO** — robots.txt, sitemap.xml (103 URL), metadata, h1/h2, OpenGraph, viewport
- [x] **Справочник 100 культур** — овощи, зелень, ягоды, бобовые, деревья, цветы, пряные травы
- [x] **Интересные факты** `/facts` — 25 фактов в 5 категориях, фильтрация, случайный факт
- [x] **Лендинг** — hero, 6 фич, CTA, footer, **Framer Motion анимации**
- [x] **Auth** — Google + Яндекс, `/auth/signin`, middleware
- [x] **Онбординг** — геолокация + карта (Leaflet), анализ региона, литературный отчёт
- [x] **Мой участок** `/garden` — CRUD растений + **вкладка «Грядки»** (CRUD, типы, фото, привязка растений)
- [x] **Календарь** `/calendar` — региональные рекомендации
- [x] **AI-чат** `/chat` — диалоговый помощник через AI Integration Service, быстрые вопросы, выбор сети
- [x] **Справочник** `/guide` — 100 культур, поиск, отдельные страницы SSG
- [x] **Камера** `/camera` — фото-анализ через GPT-4o Vision (через AI Integration Service)
- [x] **Подписка** `/subscribe` — полноценная страница
- [x] **Настройки** `/settings` — редактирование координат на карте, выход
- [x] **Погода** — WeatherAPI.com, серверный proxy `/api/weather`, виджет (компактный + полный), рекомендации для дачника
- [x] **AI Integration Service** — мульти-нейросетевой интегратор, 10 нейросетей (4 chat, 3 image_gen, 1 transcription, 1 video, 1 free)
- [x] **API routes**: plants CRUD, beds CRUD, weather proxy, chat, ai/analyze, ai/networks, payments (YooKassa), user/location, region/analyze
- [x] **React Query** — для plants, beds, weather, ai-networks и серверного состояния
- [x] **Prisma + PostgreSQL** — 2 миграции, 10 таблиц
- [x] **Framer Motion** — анимации лендинга, переходы страниц, BottomNav layoutId, stagger-списки
- [x] **PNG-иконки PWA** — 13 иконок из SVG (sharp), manifest.json обновлён
- [x] **Vitest** — 54 теста (10 файлов)
- [x] **Dockerfile** — multi-stage для TimeWeb

## Что НЕ реализовано
- [ ] Оффлайн-синхронизация (Background Sync, очередь задач)
- [ ] Push-уведомления
- [ ] Галерея с sharing
- [ ] Загрузка фото грядок (API upload + хранение)
- [ ] Активация YandexGPT / GigaChat (нужны API ключи)

## Для запуска
```bash
npm run dev
```
Откройте http://localhost:3000

## Env vars для работы
Для полного теста нужны ключи в `.env.local`:
- `AUTH_SECRET` — `openssl rand -base64 32`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- `AUTH_YANDEX_ID` / `AUTH_YANDEX_SECRET`
- `WEATHER_API_KEY` — WeatherAPI.com
- `AI_INTEGRATION_URL` — URL AI Integration Service
- `AI_INTEGRATION_API_KEY` — API-ключ клиента в AI Integration Service

Без auth работают: лендинг (`/`), справочник (`/guide`, `/guide/[slug]`), интересные факты (`/facts`)
