# CONVENTIONS

## Язык
- UI: русский
- Код: английский (имена переменных, функций, компонентов)
- Комментарии: допускается русский
- Документация AI: русский

## Структура проекта
- Next.js App Router (`app/` directory)
- Компоненты UI: `components/ui/` (shadcn)
- Бизнес-компоненты: `components/` (пока нет, всё в page.tsx)
- Утилиты: `lib/`
- Auth конфиг: `auth.ts` (корень)
- AI memory: `docs/ai/`

## Стилизация
- Tailwind CSS v4 (PostCSS plugin, не конфиг-файл)
- CSS variables для темы (oklch)
- shadcn/ui new-york style
- `cn()` из `lib/utils.ts` для мерджа классов

## Компоненты
- shadcn/ui устанавливаются через CLI: `npx shadcn add <component>`
- Стиль: new-york
- Aliases: `@/components`, `@/lib`, `@/components/ui`

## Git
- .gitignore: стандартный Next.js + .env* + .idea/ + `Идентификатор ключа.txt` + test artifacts, prisma generated

## Scripts
```
npm run dev    — dev server
npm run build  — production build
npm run start  — production server
npm run lint   — eslint
```

## Naming
- Файлы компонентов: kebab-case (shadcn convention)
- React компоненты: PascalCase
- Переменные/функции: camelCase
- CSS: Tailwind utility classes
