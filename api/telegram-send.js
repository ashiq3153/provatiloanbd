/**
 * Server-side Telegram Bot API proxy.
 * The bot token MUST stay in Vercel server environment variables.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  if (!BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not configured on the server");
    return res.status(500).json({ ok: false, error: "Telegram service is not configured" });
  }

  try {
    const { chat_id, text, reply_markup } = req.body || {};

    if (!chat_id || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ ok: false, error: "chat_id and text are required" });
    }

    const payload = {
      chat_id,
      text,
      parse_mode: "HTML",
    };

    if (reply_markup) payload.reply_markup = reply_markup;

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await telegramResponse.json();

    if (!telegramResponse.ok || !data.ok) {
      return res.status(telegramResponse.status || 502).json({
        ok: false,
        error: data.description || "Telegram API request failed",
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Telegram send proxy error:", error);
    return res.status(500).json({ ok: false, error: "Telegram request failed" });
  }
}
