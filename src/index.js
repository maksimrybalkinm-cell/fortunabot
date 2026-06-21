const WEBHOOK_PATH = "/webhook";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return jsonResponse({
        ok: true,
        message: "Telegram bot worker is running.",
      });
    }

    if (request.method === "POST" && url.pathname === WEBHOOK_PATH) {
      if (!env.TELEGRAM_BOT_TOKEN) {
        return jsonResponse({ ok: false, error: "Missing TELEGRAM_BOT_TOKEN" }, 500);
      }

      const update = await request.json();
      if (update.callback_query) {
        await handleCallbackQuery(update.callback_query, env);
        return jsonResponse({ ok: true });
      }

      await handleUpdate(update, env, url.origin);
      return jsonResponse({ ok: true });
    }

    return new Response("Not found", { status: 404 });
  },
};

async function handleUpdate(update, env, origin) {
  const message = update.message;
  if (!message || !message.chat || typeof message.chat.id === "undefined") {
    return;
  }

  const chatId = message.chat.id;
  const text = (message.text || "").trim();

  if (text === "/start") {
    await sendPhoto(
      env,
      chatId,
      `${origin}/welcome.jpg`,
      "Привет!\nВыполни эти задания",
      {
        inline_keyboard: [
          [
            {
              text: "Нажми Start",
              url: "https://t.me/Starsitofiplaybot?start=_tgr_dXVVZLI4ODAy",
            },
          ],
          [
            {
              text: "Проверить",
              callback_data: "check_start",
            },
          ],
        ],
      }
    );
    return;
  }

  if (text === "/help") {
    await sendMessage(
      env,
      chatId,
      "Napishi lyuboy tekst, i ya ego povtoryu. Eto startoviy shablon dlya tvoyego Telegram-bota."
    );
    return;
  }

  if (text === "/ping") {
    await sendMessage(env, chatId, "pong");
    return;
  }

  if (text) {
    await sendMessage(env, chatId, `Ty napisal: ${text}`);
    return;
  }

  await sendMessage(env, chatId, "Ya poka umeyu otvechat tolko na tekst.");
}

async function handleCallbackQuery(callbackQuery, env) {
  const message = callbackQuery.message;
  const callbackId = callbackQuery.id;
  const data = callbackQuery.data || "";

  if (callbackId) {
    await answerCallbackQuery(env, callbackId);
  }

  if (!message || !message.chat || typeof message.chat.id === "undefined") {
    return;
  }

  if (data === "check_start") {
    await sendMessage(env, message.chat.id, "Ваша ссылка: https://t.me/+cggLwnur0kkyZjQy");
  }
}

async function sendMessage(env, chatId, text) {
  const response = await telegramFetch(env, "sendMessage", {
    chat_id: chatId,
    text,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Telegram API error: ${response.status} ${details}`);
  }
}

async function sendPhoto(env, chatId, photoUrl, caption, replyMarkup) {
  const response = await telegramFetch(env, "sendPhoto", {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    reply_markup: replyMarkup,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Telegram API error: ${response.status} ${details}`);
  }
}

function telegramFetch(env, method, payload) {
  return fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

async function answerCallbackQuery(env, callbackQueryId) {
  const response = await telegramFetch(env, "answerCallbackQuery", {
    callback_query_id: callbackQueryId,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Telegram API error: ${response.status} ${details}`);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
    },
  });
}
