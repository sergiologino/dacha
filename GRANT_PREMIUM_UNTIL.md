# Выдать Премиум по e-mail до указанной даты (для тестировщиков)

Одноразовый `UPDATE` для PostgreSQL. Подставьте e-mail и дату окончания премиума (UTC хранится как `TIMESTAMP(3)` без таймзоны в Prisma — указывайте момент в понятной вам зоне, обычно конец дня по МСК).

Приложение смотрит на поля **`isPremium`** и **`premiumUntil`** (см. `prisma/schema.prisma`, `lib/get-user` / `/api/user/premium`).

## Запрос

```sql
-- ↓↓↓ Параметры ↓↓↓
-- E-mail пользователя, уже существующего в users
-- Дата/время: пример — конец 31.12.2026 по UTC (при необходимости сместите на МСК вручную)

UPDATE users
SET
  "isPremium" = true,
  "premiumUntil" = TIMESTAMP '2026-12-31 23:59:59.999'
WHERE email = 'tester@example.com';
```

Проверка, что строка обновилась:

```sql
SELECT id, email, "isPremium", "premiumUntil"
FROM users
WHERE email = 'tester@example.com';
```

Ожидается **одна** строка с `"isPremium" = true` и нужной `"premiumUntil"`.

## Снять премиум (откат для теста)

```sql
UPDATE users
SET
  "isPremium" = false,
  "premiumUntil" = NULL
WHERE email = 'tester@example.com';
```

## Замечания

- Если пользователя с таким e-mail нет, `UPDATE` затронет **0** строк — проверьте точное значение `email` в БД (`SELECT email FROM users WHERE email ILIKE '%часть%';`).
- Логика «истёк ли премиум» в рантайме может дополнительно сравнивать `premiumUntil` с текущим временем; для теста задайте дату в будущем.
- Выдача премиума SQL-ом **не** создаёт запись в `payments` и не синхронизируется с ЮKassa — это только ручной флаг в БД.
