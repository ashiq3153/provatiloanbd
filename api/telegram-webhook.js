/**
 * Telegram Webhook Handler — Vercel Serverless Function
 * Endpoint: POST /api/telegram-webhook
 *
 * Requests are accepted only when Telegram's configured secret-token header
 * matches TELEGRAM_WEBHOOK_SECRET. Never expose bot/service-role credentials to
 * the browser.
 */
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const MINI_APP_URL = process.env.MINI_APP_URL || "https://provatiloanbd.vercel.app";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function safeEqual(received, expected) {
  if (typeof received !== "string" || typeof expected !== "string" || !received || !expected) return false;
  const a = Buffer.from(received, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function adminClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Save a Telegram user using a server-only database credential. */
async function saveUserProfile(chatId, firstName, lastName, username) {
  const db = adminClient();
  if (!db) {
    console.error("Webhook profile sync skipped: server database credentials are not configured");
    return;
  }
  const { error } = await db.from("profiles").upsert({
    chat_id: chatId,
    first_name: firstName || "",
    last_name: lastName || null,
    username: username || null,
  }, { onConflict: "chat_id" });
  if (error) throw error;
}

/** Update bot_status using a server-only database credential. */
async function updateBotStatus(chatId, botStatus) {
  const db = adminClient();
  if (!db) {
    console.error("Webhook bot status sync skipped: server database credentials are not configured");
    return;
  }
  const { error } = await db.from("profiles").update({ bot_status: botStatus }).eq("chat_id", chatId);
  if (error) throw error;
}

async function sendMessage(chatId, text, replyMarkup) {
  if (!BOT_TOKEN) throw new Error("Telegram bot token is not configured");
  const body = { chat_id: chatId, text, parse_mode: "HTML" };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.description || "Telegram sendMessage failed");
  return data;
}

const SUPPORT_MESSAGE =
  `📢 <b>লোন আবেদন, স্ট্যাটাস চেক বা বিস্তারিত তথ্যের জন্য অনুগ্রহ করে Loan Application App টি খুলুন।</b>\n\n` +
  `সকল লোন-সংক্রান্ত সহায়তা ইন-অ্যাপ <b>Live Chat</b> সিস্টেমের মাধ্যমে পাওয়া যাবে।\n\n` +
  `আপনি সরাসরি সাপোর্টে যোগাযোগ করতে পারেন:\n` +
  `✅ Live Chat\n` +
  `✅ WhatsApp Support\n` +
  `✅ Telegram Support\n\n` +
  `নিচের বাটনটি ক্লিক করে এগিয়ে যান।`;

function getMiniAppKeyboard() {
  return {
    inline_keyboard: [[{
      text: "📝 Open Loan Application",
      web_app: { url: MINI_APP_URL },
    }]],
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Fail closed until a strong secret is configured in Vercel and registered
  // with Telegram through the protected setup endpoint.
  if (!WEBHOOK_SECRET || !safeEqual(req.headers["x-telegram-bot-api-secret-token"], WEBHOOK_SECRET)) {
    return res.status(401).json({ error: "Unauthorized webhook request" });
  }

  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ error: "Invalid update payload" });
  }

  try {
    const update = req.body;
    const message = update.message;
    if (message && typeof message.text === "string" && message.chat?.id) {
      const chatId = message.chat.id;
      const text = message.text.trim();
      if (text === "/start") {
        await saveUserProfile(chatId, message.chat.first_name, message.chat.last_name, message.chat.username);
        await sendMessage(
          chatId,
          `🏦 <b>PROVATI LOAN-এ আপনাকে স্বাগতম।</b>\n\n` +
          `ব্যক্তিগত, ব্যবসায়ী, প্রবাসী ও অন্যান্য ঋণের জন্য আবেদন করতে নিচের বাটনে ক্লিক করুন।\n\n` +
          `✅ দ্রুত আবেদন\n` +
          `✅ অনলাইন প্রক্রিয়া\n` +
          `✅ আবেদন স্ট্যাটাস ট্র্যাকিং`,
          getMiniAppKeyboard()
        );
      } else {
        await sendMessage(chatId, SUPPORT_MESSAGE, getMiniAppKeyboard());
      }
    }

    if (update.my_chat_member) {
      const memberUpdate = update.my_chat_member;
      const chatId = memberUpdate.chat?.id;
      const newStatus = memberUpdate.new_chat_member?.status;
      if (chatId && newStatus) {
        const botStatus = newStatus === "kicked" ? "blocked" : newStatus === "member" ? "active" : null;
        if (botStatus) await updateBotStatus(chatId, botStatus);
      }
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).json({ ok: false });
  }
}
