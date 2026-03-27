# Удаление пользователя по e-mail (для тестирования)

Скрипт для **PostgreSQL**. Подставьте свой `email`, выполните в клиенте с доступом к БД из `DATABASE_URL`.

**Назначение:** полностью убрать пользователя и связанные с ним данные (грядки, растения, таймлайны, фото, чат, платежи и т.д.), чтобы с тем же e-mail снова пройти регистрацию через OAuth.

## Важно

- Таблицы **`crops`**, **`crop_guides`**, **`prompts`**, **`shared_content`** не трогаются — это общие данные.
- Перед удалением строки из `users` выполняются явные `DELETE` по `userId` там, где нет каскада или он необязателен (**`ai_call_logs`**, **`payments`**, **`chat_messages`**). Если какой-то таблицы ещё нет в вашей БД — уберите соответствующий `DELETE` (или игнорируйте ошибку «relation does not exist»).
- После `DELETE FROM users` строки в дочерних таблицах с **`ON DELETE CASCADE`** к `users` удаляются автоматически (`accounts`, `sessions`, `beds`, `plants`, `photos`, …).
- **`verification_tokens`:** у NextAuth `identifier` часто совпадает с e-mail; если токены не удалятся, посмотрите фактическое значение: `SELECT * FROM verification_tokens WHERE identifier LIKE '%ваш_email%';`.

## Запрос

Замените **`your-email@example.com`** во всех вхождениях на нужный адрес (как в колонке `users.email`).

```sql
BEGIN;

DELETE FROM ai_call_logs
WHERE "userId" = (SELECT id FROM users WHERE email = 'your-email@example.com');

DELETE FROM payments
WHERE "userId" = (SELECT id FROM users WHERE email = 'your-email@example.com');

DELETE FROM chat_messages
WHERE "userId" = (SELECT id FROM users WHERE email = 'your-email@example.com');

DELETE FROM phone_auth_codes
WHERE "userId" = (SELECT id FROM users WHERE email = 'your-email@example.com');

DELETE FROM verification_tokens
WHERE identifier = 'your-email@example.com';

DELETE FROM users
WHERE email = 'your-email@example.com';

COMMIT;
```

Для проверки без фиксации замените последнюю строку на `ROLLBACK;`.

## Проверка

```sql
SELECT id, email FROM users WHERE email = 'your-email@example.com';
```

Должно быть **0** строк.

## psql: один параметр без копирования e-mail

```sql
\set email 'your-email@example.com'

BEGIN;
DELETE FROM ai_call_logs WHERE "userId" = (SELECT id FROM users WHERE email = :'email');
DELETE FROM payments WHERE "userId" = (SELECT id FROM users WHERE email = :'email');
DELETE FROM chat_messages WHERE "userId" = (SELECT id FROM users WHERE email = :'email');
DELETE FROM phone_auth_codes WHERE "userId" = (SELECT id FROM users WHERE email = :'email');
DELETE FROM verification_tokens WHERE identifier = :'email';
DELETE FROM users WHERE email = :'email';
COMMIT;
```

Синтаксис `:'email` в psql подставляет значение переменной как **строковый литерал** SQL (с кавычками).
