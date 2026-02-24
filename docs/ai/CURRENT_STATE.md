# CURRENT_STATE

## Статус: Активная разработка — AI-интеграция завершена

## Что реализовано
- [x] Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui
- [x] **126 страниц** (19 маршрутов + 100 SSG страниц культур)
- [x] **PWA** — manifest.json, service worker, полный набор PNG-иконок (13 шт, включая maskable + apple-touch)
- [x] **SEO** — robots.txt, sitemap.xml (103 URL), metadata, h1/h2, OpenGraph, viewport
- [x] **Аналитика** — Яндекс.Метрика (NEXT_PUBLIC_YM_ID), Google Analytics gtag (NEXT_PUBLIC_GA_ID), верификация Яндекса (meta yandex-verification, fallback 57dacdee3aae7bf0)
- [x] **Справочник 100 культур** — фото (Unsplash), сорта (3–6 шт для топ-20), AI-подробности с кешем в БД
- [x] **Интересные факты** `/facts` — 25 фактов в 5 категориях, фильтрация, случайный факт
- [x] **Лендинг** — hero, 6 фич, CTA, footer, **Framer Motion анимации**
- [x] **Auth** — Google + Яндекс, `/auth/signin`, middleware
- [x] **Онбординг** — геолокация + карта (Leaflet), анализ региона, литературный отчёт
- [x] **Мой участок** `/garden` — CRUD растений + **вкладка «Грядки»** (CRUD, типы, фото, привязка растений)
- [x] **Календарь** `/calendar` — 50+ задач на 12 месяцев, 5 категорий, переключатель месяцев, ссылки на справочник
- [x] **AI-чат** `/chat` — диалоговый помощник, быстрые вопросы, лимит 5 запросов/мес для бесплатных, paywall
- [x] **Справочник** `/guide` — 100 культур, **аккордеон по категориям**, поиск + AI-поиск неизвестных, SSG, paywall на руководство
- [x] **Камера** `/camera` — фото-анализ через GPT-4o Vision, лимит 3 анализа/мес для бесплатных
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
- [ ] **Детальный календарь (Премиум)** — переключение с краткого на детальный по дням с лунным календарём посадок и народным российским календарём с приметами
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
- `NEXT_PUBLIC_YM_ID` / `NEXT_PUBLIC_GA_ID` — счётчики аналитики; `NEXT_PUBLIC_YANDEX_VERIFICATION` — код верификации в Вебмастере (по умолчанию 57dacdee3aae7bf0)

Без auth работают: лендинг (`/`), справочник (`/guide`, `/guide/[slug]`), интересные факты (`/facts`)
