/**
 * Dedicated Admin Bot webhook.
 * Endpoint: POST /api/telegram-admin-webhook
 *
 * Uses only the Admin Bot token and its own webhook secret. The regular
 * user-bot webhook remains independent. Admin access is additionally limited
 * to TELEGRAM_ADMIN_CHAT_IDS before an admin-panel button is sent.
 */
import crypto from "node:crypto";

const ADMIN_BOT_TOKEN = process.env.TELEGRAM_ADMIN_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_ADMIN_WEBHOOK_SECRET;
const ADMIN_CHAT_IDS = new Set(
  String(process.env.TELEGRAM_ADMIN_CHAT_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);
const ADMIN_APP_URL = "https://provatiloanbd.vercel.app/admin";

function safeEqual(received, expected) {
  if (typeof received !== "string" || typeof expected !== "string" || !received || !expected) return false;
  const a = Buffer.from(received, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function sendMessage(chatId, text, replyMarkup) {
  if (!ADMIN_BOT_TOKEN) throw new Error("Admin Bot token is not configured");
  const body = { chat_id: chatId, text, parse_mode: "HTML" };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const response = await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.description || "Telegram sendMessage failed");
}

function adminKeyboard() {
  return {
    inline_keyboard: [[{
      text: "🔐 Open Admin Panel",
      web_app: { url: ADMIN_APP_URL },
    }]],
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!WEBHOOK_SECRET || !safeEqual(req.headers["x-telegram-bot-api-secret-token"], WEBHOOK_SECRET)) {
    return res.status(401).json({ error: "Unauthorized webhook request" });
  }

  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ error: "Invalid update payload" });
  }

  try {
    const message = req.body.message;
    if (!message || typeof message.text !== "string" || !message.chat?.id) {
      return res.status(200).json({ ok: true });
    }

    const chatId = String(message.from?.id || message.chat.id);
    if (!ADMIN_CHAT_IDS.has(chatId)) {
      await sendMessage(message.chat.id, "⛔ এই অ্যাকাউন্টের Admin Panel ব্যবহারের অনুমতি নেই।");
      return res.status(200).json({ ok: true });
    }

    const text = message.text.trim();
    if (text === "/start" || text === "/admin") {
      await sendMessage(
        message.chat.id,
        "🔐 <b>PROVATI LOAN Admin Bot</b>\n\nঅ্যাডমিন প্যানেল খুলতে নিচের বাটনে চাপ দিন। আপনার অ্যাকাউন্টের অনুমতি সার্ভারে আলাদাভাবে যাচাই করা হবে।",
        adminKeyboard()
      );
    } else {
      await sendMessage(message.chat.id, "অ্যাডমিন প্যানেল ব্যবহার করতে /admin লিখুন।", adminKeyboard());
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Admin Bot webhook handler error:", error);
    return res.status(500).json({ ok: false });
  }
}
