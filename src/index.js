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
      await handleUpdate(update, env);
      return jsonResponse({ ok: true });
    }

    return new Response("Not found", { status: 404 });
  },
};

async function handleUpdate(update, env) {
  const message = update.message;
  if (!message || !message.chat || typeof message.chat.id === "undefined") {
    return;
  }

  const chatId = message.chat.id;
  const text = (message.text || "").trim();

  if (text === "/start") {
    await sendMessage(
      env,
      chatId,
      "Privet! Ya zapushen v Cloudflare Workers.\n\nKomandy: /help, /ping"
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

async function sendMessage(env, chatId, text) {
  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    }
  );

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
