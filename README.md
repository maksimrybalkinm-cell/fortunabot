# Telegram bot on Cloudflare Workers

Этот вариант не требует платного хоста и не держит включенным твой ПК. Бот принимает обновления через Telegram webhook.

## Что уже готово

- `src/index.js` - код Cloudflare Worker
- `public/welcome.jpg` - картинка для команды `/start`
- `wrangler.jsonc` - конфиг Worker

## Как запустить через Cloudflare Dashboard

1. Зайди в [Cloudflare Workers](https://dash.cloudflare.com/).
2. Открой `Workers & Pages`.
3. Нажми `Create application` или `Create Worker`.
4. Назови Worker, например `fortunabot-worker`.
5. Открой редактор кода и замени содержимое на код из `src/index.js`.
6. В `Settings` -> `Variables and Secrets` добавь secret:

```text
TELEGRAM_BOT_TOKEN
```

7. Нажми `Deploy`.
8. После деплоя скопируй URL вида:

```text
https://fortunabot-worker.<your-subdomain>.workers.dev
```

9. Привяжи Telegram webhook, открыв в браузере:

```text
https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://fortunabot-worker.<your-subdomain>.workers.dev/webhook
```

10. Для проверки открой:

```text
https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo
```

## Что умеет бот

- `/start` отправляет картинку и подпись `Privetstvuem!`
- `/help`
- `/ping`
- повторяет любой текст

## Важно

- Если ты уже светил токен, сначала перевыпусти его через `@BotFather`.
- После смены токена обнови secret в Cloudflare.
- Если раньше бот работал через `getUpdates`, Cloudflare-версия использует `webhook`, это нормально.
