import json
import os
import time
from pathlib import Path
from urllib import error, request


BASE_DIR = Path(__file__).resolve().parent
CONFIG_FILE = BASE_DIR / "config.env"


class TelegramApiError(RuntimeError):
    pass


def load_config() -> None:
    if not CONFIG_FILE.exists():
        return

    for raw_line in CONFIG_FILE.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def telegram_request(token: str, method: str, payload: dict | None = None) -> dict:
    body = json.dumps(payload or {}).encode("utf-8")
    http_request = request.Request(
        f"https://api.telegram.org/bot{token}/{method}",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(http_request, timeout=45) as response:
            data = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise TelegramApiError(f"HTTP {exc.code}: {detail}") from exc
    except error.URLError as exc:
        raise TelegramApiError(f"Network error: {exc.reason}") from exc

    if not data.get("ok"):
        raise TelegramApiError(data.get("description", "Unknown Telegram API error"))

    return data


def send_message(token: str, chat_id: int, text: str) -> None:
    telegram_request(
        token,
        "sendMessage",
        {
            "chat_id": chat_id,
            "text": text,
        },
    )


def handle_message(token: str, message: dict) -> None:
    chat = message.get("chat") or {}
    chat_id = chat.get("id")
    text = (message.get("text") or "").strip()

    if chat_id is None:
        return

    if text == "/start":
        send_message(
            token,
            chat_id,
            "Привет! Я запущен на твоем ПК.\n\nКоманды: /help, /ping",
        )
        return

    if text == "/help":
        send_message(
            token,
            chat_id,
            "Напиши любой текст, и я повторю его. Это стартовый шаблон, сюда можно добавить меню, заявки, базу данных и другие функции.",
        )
        return

    if text == "/ping":
        send_message(token, chat_id, "pong")
        return

    if text:
        send_message(token, chat_id, f"Ты написал: {text}")
    else:
        send_message(token, chat_id, "Я пока умею отвечать только на текст.")


def main() -> None:
    load_config()
    token = os.getenv("TELEGRAM_BOT_TOKEN")

    if not token:
        print("Не найден TELEGRAM_BOT_TOKEN.")
        print("Создай файл config.env рядом с bot.py и добавь туда:")
        print("TELEGRAM_BOT_TOKEN=твой_токен_от_BotFather")
        raise SystemExit(1)

    print("Бот запускается...")
    telegram_request(token, "deleteWebhook", {"drop_pending_updates": False})
    print("Бот запущен. Нажми Ctrl+C, чтобы остановить.")

    offset = None

    while True:
        try:
            updates = telegram_request(
                token,
                "getUpdates",
                {
                    "offset": offset,
                    "timeout": 30,
                    "allowed_updates": ["message"],
                },
            )["result"]

            for update in updates:
                offset = update["update_id"] + 1
                message = update.get("message")
                if message:
                    handle_message(token, message)

        except KeyboardInterrupt:
            print("\nБот остановлен.")
            break
        except TelegramApiError as exc:
            print(f"Ошибка Telegram API: {exc}")
            time.sleep(5)
        except Exception as exc:
            print(f"Неожиданная ошибка: {exc}")
            time.sleep(5)


if __name__ == "__main__":
    main()
