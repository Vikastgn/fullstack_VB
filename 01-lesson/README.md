# Weather Lens Bot

Telegram-бот на **Fastify**, который получает название города и отвечает текущей погодой с прогнозом на три дня. Источник данных — [Open-Meteo](https://open-meteo.com/); API-ключ не требуется.

## Возможности

- `Москва` → текущая погода и прогноз на три дня;
- `Saint Petersburg` → можно использовать русские и латинские названия;
- `/weather Казань` → явная команда с названием города;
- `/start` → краткая подсказка.

## Архитектура

Проект следует Clean Architecture:

- `src/domain` — чистые правила предметной области и погодные коды;
- `src/application` — use cases, без зависимости от Fastify/Telegram;
- `src/infrastructure` — адаптеры Telegram, Open-Meteo и HTTP;
- `api/index.js` — serverless entry point Vercel.

C4-диаграммы в стиле C4-PlantUML: [context](docs/c4-context.md), [container](docs/c4-container.md), [components](docs/c4-components.md). Их исходники `.puml` и готовые PNG лежат в `docs/`.

### Просмотр и редактирование C4-диаграмм

PNG уже отображаются на GitHub. Для редактирования исходников `.puml` в WebStorm: **File → Settings → Plugins → Marketplace → PlantUML integration → Install**, затем перезапустите IDE и откройте файл `docs/c4-*.puml`. Плагин необязателен для работы бота.

## Локальный запуск

Нужен Node.js 20+.

```powershell
npm install
Copy-Item .env.example .env
# заполните TELEGRAM_BOT_TOKEN и TELEGRAM_WEBHOOK_SECRET в .env
npm run dev
```

Скрипт `npm run dev` автоматически читает локальный файл `.env`. Этот файл исключён из Git и не попадёт в репозиторий.

Проверка сервиса: `GET http://localhost:3000/health`.

## Деплой на Vercel и подключение Telegram

1. Загрузите проект в публичный GitHub-репозиторий.
2. В Vercel: **Add New → Project**, импортируйте репозиторий и нажмите Deploy.
3. В Vercel → **Settings → Environment Variables** добавьте `TELEGRAM_BOT_TOKEN` и `TELEGRAM_WEBHOOK_SECRET`, затем выполните Redeploy.
4. Привяжите webhook, подставив домен, токен и секрет:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" `
  -ContentType 'application/json' `
  -Body '{"url":"https://<your-vercel-domain>/telegram/webhook/<TELEGRAM_WEBHOOK_SECRET>"}'
```

5. Проверьте статус webhook:

```powershell
Invoke-RestMethod "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

Никогда не добавляйте токен или секрет в Git: `.env` уже исключён из репозитория.

## Тесты

```bash
npm test
```

## Supabase Edge Function (урок 2)

В этом же проекте находится выполненное задание второго урока: endpoint
`my-function`. Он принимает только `GET`-запрос и отвечает JSON:

```json
{
  "message": "hello, it-incubator",
  "studentId": 3116
}
```

Для локальной проверки из папки `01-lesson` запустите Supabase, а затем
откройте endpoint:

```powershell
npx supabase start
Invoke-RestMethod http://127.0.0.1:54321/functions/v1/my-function
```

После привязки к облачному Supabase-проекту функцию можно опубликовать командой:

```powershell
npx supabase functions deploy my-function
```

## Что указать в отчёте

1. **Название бота:** Weather Lens Bot (можно заменить в @BotFather).
2. **Дополнительные функции:** текущая температура плюс компактный прогноз на три дня; поддерживается команда `/weather <город>`.
