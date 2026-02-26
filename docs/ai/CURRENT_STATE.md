# CURRENT_STATE

## Статус: Активная разработка — AI-интеграция завершена

## Что реализовано
- [x] Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui
- [x] **Название приложения** — «Любимая Дача» (вместо ДачаAI)
- [x] **126+ страниц** (19 маршрутов + 100 SSG страниц культур)
- [x] **PWA** — manifest.json, service worker, полный набор PNG-иконок (13 шт, включая maskable + apple-touch)
- [x] **SEO** — robots.txt, sitemap.xml (103 URL), metadata, h1/h2, OpenGraph, viewport
- [x] **Аналитика** — Яндекс.Метрика (NEXT_PUBLIC_YM_ID), Google Analytics gtag (NEXT_PUBLIC_GA_ID), верификация Яндекса (meta yandex-verification, fallback 57dacdee3aae7bf0)
- [x] **Справочник 100 культур** — фото (Unsplash), сорта (3–6 шт для топ-20), AI-подробности с кешем в БД
- [x] **Интересные факты** `/facts` — 25 фактов в 5 категориях, фильтрация, случайный факт
- [x] **Лендинг** — hero, 6 фич, CTA, footer, **Framer Motion анимации**
- [x] **Auth** — Google + Яндекс, `/auth/signin`, middleware
- [x] **Онбординг** — геолокация + карта (Leaflet), анализ региона, литературный отчёт
- [x] **Мой участок** `/garden` — CRUD растений + **грядки** (CRUD; типы: открытый грунт, теплица, высокая грядка, **рассада дома**); дата посадки при добавлении и редактируемая в строке; **фото растения на грядке** (иконка камеры → съёмка/выбор файла → привязка к растению, грядке, дате; превью под растением); **добавление растения из справочника** (поиск от 3 символов по названию и сорту или выбор по категории → культура → сорт); у растения с привязкой к справочнику имя — ссылка на `/guide/[slug]`
- [x] **Календарь** `/calendar` — 50+ задач на 12 месяцев, 5 категорий, переключатель месяцев, ссылки на справочник
- [x] **AI-чат** `/chat` — диалоговый помощник, быстрые вопросы, лимит 5 запросов/мес для бесплатных, paywall
- [x] **Справочник** `/guide` — 100+ культур (статика + **добавленные дачниками**), аккордеон по категориям, поиск + нейроэксперт; под ответом нейроэксперта кнопка **«Добавить в справочник»** (извлечение структуры + запрос фото через интегратор, сохранение в БД с пометкой «Добавлено дачниками»), SSG + динамика по slug, paywall на руководство
- [x] **Камера** `/camera` — фото-анализ через GPT-4o Vision, лимит 3 анализа/мес для бесплатных
- [x] **Подписка** `/subscribe` — полноценная страница
- [x] **Настройки** `/settings` — редактирование координат на карте, выход
- [x] **Погода** — WeatherAPI.com, серверный proxy `/api/weather`, виджет (компактный + полный), рекомендации для дачника
- [x] **AI Integration Service** — мульти-нейросетевой интегратор, 10 нейросетей (4 chat, 3 image_gen, 1 transcription, 1 video, 1 free)
- [x] **API routes**: plants CRUD + PATCH, beds CRUD, **photos POST** (upload в public/uploads), weather proxy, chat, ai/analyze, ai/networks, payments (YooKassa), user/location, region/analyze
- [x] **React Query** — для plants, beds, weather, ai-networks и серверного состояния
- [x] **Prisma + PostgreSQL** — 2 миграции, 10 таблиц
- [x] **Framer Motion** — анимации лендинга, переходы страниц, BottomNav layoutId, stagger-списки
- [x] **PNG-иконки PWA** — 13 иконок из SVG (sharp), manifest.json обновлён
- [x] **Vitest** — 54 теста (10 файлов)
- [x] **Dockerfile** — multi-stage для TimeWeb; build args для NEXT_PUBLIC_GA_ID/YM_ID; NODE_OPTIONS=4096 для билда (избежать зависания)

## Деплой (Docker)
Полная инструкция с миграциями и переменными окружения: **[docs/DEPLOY.md](../DEPLOY.md)**.

Кратко: при сборке передать build args (NEXT_PUBLIC_GA_ID, NEXT_PUBLIC_YM_ID, DATABASE_URL). **Перед запуском контейнера** выполнить миграции: `npx prisma migrate deploy` с продакшен-`DATABASE_URL`. В TimeWeb/CI добавить переменные на этап build; NODE_OPTIONS=4096 уже в Dockerfile.

## Return URL после оплаты (YooKassa)
После оплаты кнопка «Вернуться на сайт» ведёт на `{BASE_URL}/garden?payment=success`. BASE_URL берётся из `NEXTAUTH_URL` или `NEXT_PUBLIC_APP_URL` (иначе — из запроса). **На продакшене обязательно задать** `NEXTAUTH_URL=https://dacha-ai.ru` (или ваш домен), иначе возврат может вести на 0.0.0.0:3000 и страница будет недоступна.

## Что реализовано (дополнение)
- [x] **Детальный календарь (Премиум)** — переключение с краткого на детальный по дням с лунным календарём посадок и народным российским календарём с приметами
- [x] **Учёт платежей и тарифов** — запись при создании платежа (POST /api/payments), обновление статуса при синхронизации (GET /api/payments/sync). В настройках у **админа** (ADMIN_EMAILS) вкладка «Платежи»: таблица по всем платежам (дата, пользователь, сумма, тариф, статус: оплачен/отменён/ожидание)

## Что НЕ реализовано
- [ ] Оффлайн-синхронизация (Background Sync, очередь задач)
- [ ] Push-уведомления
- [ ] Галерея с sharing
- [ ] Таймлайн роста растения на грядке (всходы, пересадка и т.д.); напоминания по расписанию (полив, рыхление, освещение/температура для рассады)
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
