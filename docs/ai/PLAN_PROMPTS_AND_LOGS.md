# План: промпты в БД и логи вызовов нейросетей

## Цели
1. **Промпты в таблице** — вынести тексты промптов из кода в отдельную таблицу (без связей) для анализа и улучшения. Поля: сам промт, описание (для чего используется), эндпойнт (куда отправляется).
2. **Логи вызовов** — таблица логов: вызовы нейросетей, сообщения в вызове, пользователь, дата/время, ответ, расход токенов (из ответа интегратора). Для мониторинга расходов.

## Оценка сложности: **средняя**

- Таблицы и миграции — просто.
- Замена констант на чтение из БД — потребует ключей/слогов и учёта динамических частей (чат + погода/локация, guide + культура, crops + название культуры).
- Логирование — единообразно добавить во все точки вызова AI (5–6 мест); парсинг `usage` из ответа — если интегратор отдаёт, иначе поля null.

## Текущие места с промптами и вызовами AI

| Место | Промпт(ы) | Эндпойнт нашего приложения | Внешний вызов |
|------|-----------|----------------------------|---------------|
| `app/api/chat/route.ts` | system (база + локация + погода) | POST /api/chat | `${AI_URL}/api/ai/process` |
| `app/api/ai/analyze/route.ts` | system (vision) + локация | POST /api/ai/analyze | `${AI_URL}/api/ai/process` |
| `app/api/guide/detail/route.ts` | user (crop + location) | GET /api/guide/detail | `${AI_URL}/api/ai/process` |
| `app/api/crops/route.ts` | image prompt; system для JSON | POST /api/crops | `${AI_URL}/api/ai/process` (2 вызова) |
| `lib/timeline-generate.ts` | system + user | (внутренний) | `${AI_URL}/api/ai/process` |

## Шаги реализации

### 1. Prisma: модель Prompt (таблица без связей)
- Поля: `id`, `key` (String, unique — slug для выбора в коде), `prompt` (Text), `description` (String), `endpoint` (String?, пример: `POST /api/chat` или внешний URL).
- Миграция.

### 2. Prisma: модель AiCallLog (таблица логов)
- Поля: `id`, `userId` (String?, опционально), `createdAt`, `endpoint` (String — наш роут, напр. `/api/chat`), `requestType` (String — chat/vision), `messages` (Json — массив ролей и длин/превью сообщений, без больших тел), `responsePreview` (String? — первые N символов ответа), `tokensInput` (Int?), `tokensOutput` (Int?), `tokensTotal` (Int?), `status` (success/failed), `errorMessage` (String?).
- Связь с User по `userId` опционально (для анонимных не заполняем). Миграция.

### 3. Seed: заполнить таблицу Prompt
- Перенести текущие тексты из кода в записи с ключами, например: `chat_system`, `timeline_system`, `timeline_user`, `guide_detail_user`, `crops_image`, `crops_extract_system`, `vision_system`. Для динамических (чат, guide, crops) — хранить шаблон или базовый текст; подстановки (локация, культура, погода) остаются в коде.

### 4. Хелпер: чтение промптов из БД
- `getPromptByKey(key: string): Promise<string | null>` (или синхронный кеш после первой загрузки). В местах вызова AI подставлять текст из БД по ключу; динамические части дополнять в коде.

### 5. Замена промптов в коде на чтение из БД
- В каждом из мест (chat, analyze, guide/detail, crops, timeline-generate) заменить константы/функции построения промпта на вызов getPromptByKey + подстановки. Fallback на текущий текст из кода, если записи в БД нет.

### 6. Хелпер логирования и извлечение usage
- `logAiCall(params: { userId?, endpoint, requestType, messages, response, responseData?, status })`. Из `responseData` (ответ интегратора) парсить `usage`: `prompt_tokens`, `completion_tokens`, `total_tokens` (если интегратор отдаёт — иначе null). Писать в AiCallLog.

### 7. Внести вызовы logAiCall
- После каждого вызова к AI: chat, ai/analyze, guide/detail, crops (оба вызова), timeline-generate. Передавать userId (если есть), endpoint, сообщения (сводка/превью), ответ (превью), usage, status.

### 8. Документация
- В CURRENT_STATE или ARCHITECTURE описать таблицы `Prompt` и `AiCallLog`, где смотреть промпты и как анализировать логи/расход токенов.

## Зависимости
- Ответ AI Integration Service: если в теле ответа есть `usage` (prompt_tokens, completion_tokens) — сохраняем; иначе поля токенов в логах останутся null до доработки интегратора.
