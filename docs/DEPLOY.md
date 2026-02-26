# Деплой «Любимая Дача» на сервер

Инструкция с учётом миграций БД и переменных окружения.

---

## 1. Подготовка

### 1.1. База данных

- **PostgreSQL** должен быть развёрнут и доступен по сети.
- Строка подключения: `DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE`

### 1.2. Переменные окружения

Соберите значения для **сборки** и **рантайма**.

**Обязательные при сборке (NEXT_PUBLIC_* вшиваются в бандл):**

| Переменная | Описание |
|------------|----------|
| `NEXT_PUBLIC_GA_ID` | ID счётчика Google Analytics (например `G-XXXXXXXX`) |
| `NEXT_PUBLIC_YM_ID` | ID счётчика Яндекс.Метрики |
| `DATABASE_URL` | Строка подключения к PostgreSQL (для `prisma generate` при сборке можно dummy) |

**Обязательные при запуске (рантайм):**

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | Реальная строка подключения к PostgreSQL |
| `AUTH_SECRET` | Секрет NextAuth (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL приложения (например `https://dacha-ai.ru`) |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | OAuth Google |
| `AUTH_YANDEX_ID`, `AUTH_YANDEX_SECRET` | OAuth Яндекс |
| `WEATHER_API_KEY` | Ключ WeatherAPI.com |
| `AI_INTEGRATION_URL`, `AI_INTEGRATION_API_KEY` | AI-интегратор |
| `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY` | ЮKassa (оплаты) |
| `ADMIN_EMAILS` | Список email админов через запятую (для админки и платежей) |

**Опционально (рантайм):**

| Переменная | Описание |
|------------|----------|
| `NEXT_PUBLIC_FEEDBACK_TELEGRAM_URL` | Ссылка на Telegram для обратной связи (отдаётся через `/api/config`) |
| `NEXT_PUBLIC_FEEDBACK_MAX_URL` | Ссылка на MAX для обратной связи |
| `NEXT_PUBLIC_YANDEX_VERIFICATION` | Код верификации в Вебмастере Яндекса |

---

## 2. Миграции БД

Миграции нужно применить **до первого запуска** приложения (или при каждом обновлении, если появились новые миграции).

### Вариант A: на сервере (рекомендуется)

На машине, с которой есть доступ к продакшен-БД:

```bash
# В корне проекта (или там, где лежит prisma/)
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"

# Применить все миграции из prisma/migrations/
npx prisma migrate deploy
```

Успешный вывод: `Applied X migration(s).`

### Вариант B: через Docker (одноразовый контейнер)

Если на сервере нет Node, можно запустить миграции из временного контейнера:

```bash
docker run --rm \
  -e DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE" \
  -v "$(pwd)/prisma:/app/prisma" \
  -w /app \
  node:22-alpine \
  sh -c "npm init -y && npx prisma migrate deploy"
```

Либо использовать образ приложения и выполнить команду внутри него (если в образе есть `prisma` и `migrations`).

### Если миграций ещё не было (первый деплой)

При первом деплое на пустую БД:

```bash
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy
```

Это создаст все таблицы по текущим миграциям в `prisma/migrations/`.

### Если что-то пошло не так

- **Ошибка «migration failed»:** проверьте логи, откатите при необходимости вручную или через `prisma migrate resolve`.
- **Нужно только «подтянуть» схему без миграций** (для быстрого прототипа):  
  `npx prisma db push`  
  В продакшене предпочтительно использовать `migrate deploy`.

---

## 3. Деплой через Docker

### 3.1. Сборка образа

В корне репозитория:

```bash
docker build \
  --build-arg NEXT_PUBLIC_GA_ID="G-XXXXXXXX" \
  --build-arg NEXT_PUBLIC_YM_ID="XXXXXXXX" \
  --build-arg DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
  -t dacha-ai:latest .
```

- `DATABASE_URL` при сборке может быть заглушкой (нужен для `prisma generate`).
- Реальный `DATABASE_URL` задаётся при запуске контейнера (см. ниже).
- Для билда уже задан `NODE_OPTIONS=--max-old-space-size=4096` в Dockerfile (снижает риск падения при генерации 100+ SSG страниц).

### 3.2. Запуск контейнера

```bash
docker run -d \
  --name dacha-ai \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE" \
  -e AUTH_SECRET="..." \
  -e NEXTAUTH_URL="https://dacha-ai.ru" \
  -e AUTH_GOOGLE_ID="..." \
  -e AUTH_GOOGLE_SECRET="..." \
  -e AUTH_YANDEX_ID="..." \
  -e AUTH_YANDEX_SECRET="..." \
  -e WEATHER_API_KEY="..." \
  -e AI_INTEGRATION_URL="..." \
  -e AI_INTEGRATION_API_KEY="..." \
  -e YOOKASSA_SHOP_ID="..." \
  -e YOOKASSA_SECRET_KEY="..." \
  -e ADMIN_EMAILS="admin@example.com" \
  dacha-ai:latest
```

Остальные переменные (обратная связь, верификация и т.д.) при необходимости добавьте через `-e`.

**Важно:** миграции к этому моменту уже должны быть применены (шаг 2). Контейнер при старте миграции не выполняет.

### 3.3. Обновление (редеплой)

1. Применить миграции (если появились новые):
   ```bash
   export DATABASE_URL="postgresql://..."
   npx prisma migrate deploy
   ```
2. Собрать новый образ (с теми же build-arg, что и выше).
3. Остановить и удалить старый контейнер:  
   `docker stop dacha-ai && docker rm dacha-ai`
4. Запустить новый контейнер с теми же `-e` (или использовать docker-compose).

---

## 4. Деплой без Docker (Node на сервере)

### 4.1. Установка и сборка

```bash
cd /path/to/dacha-ai
npm ci
export DATABASE_URL="postgresql://..."
npx prisma generate
npx prisma migrate deploy
npm run build
```

### 4.2. Запуск

```bash
export DATABASE_URL="..."
export AUTH_SECRET="..."
export NEXTAUTH_URL="https://dacha-ai.ru"
# ... остальные переменные

node .next/standalone/server.js
```

Либо использовать PM2/systemd с `NODE_ENV=production` и теми же переменными окружения.

---

## 5. Чек-лист перед продакшеном

- [ ] Миграции применены: `npx prisma migrate deploy`
- [ ] `NEXTAUTH_URL` совпадает с реальным доменом (возврат после оплаты и логин)
- [ ] `ADMIN_EMAILS` задан (для админки и вкладки «Платежи» в настройках)
- [ ] В сборку переданы `NEXT_PUBLIC_GA_ID` и `NEXT_PUBLIC_YM_ID` (если нужна аналитика)
- [ ] ЮKassa: на продакшене используются боевые `YOOKASSA_SHOP_ID` и `YOOKASSA_SECRET_KEY`

---

## 6. Краткая последовательность (рекомендуемая)

1. Развернуть PostgreSQL, получить `DATABASE_URL`.
2. Клонировать репозиторий на сервер (или собирать образ в CI).
3. Выполнить миграции:  
   `DATABASE_URL="..." npx prisma migrate deploy`
4. Собрать образ (Docker) или `npm run build` (без Docker).
5. Запустить приложение с полным набором переменных окружения.
6. Проверить: `https://ваш-домен/api/health` → `{"status":"ok"}`.

После этого можно открывать сайт, логиниться и при необходимости проверить админку (Настройки → Платежи) под учётной записью из `ADMIN_EMAILS`.

---

## 7. Не вижу вкладку «Платежи» в Настройках

Вкладка **«Платежи»** (и блок «Управление (Админ)») показываются **только если ваш email входит в список админов**.

1. **Где смотреть:** Настройки — иконка профиля (аватар) в шапке справа → «Настройки», или URL `/settings`.
2. **Проверьте на сервере переменную `ADMIN_EMAILS`:**
   - Должна быть задана при запуске контейнера/процесса (рантайм), например:  
     `ADMIN_EMAILS=your@email.com` или `ADMIN_EMAILS=admin1@mail.ru,admin2@gmail.com`.
   - Регистр букв в email не важен (сравнение идёт по нижнему регистру).
   - Пробелы вокруг запятых допустимы — они обрезаются.
3. **После изменения переменной** перезапустите приложение и при необходимости обновите страницу Настроек или перелогиньтесь.
4. Если после этого вкладки «Профиль» и «Платежи» по-прежнему нет — проверьте, что в приложении вы залогинены под тем же email, который указан в `ADMIN_EMAILS`.
