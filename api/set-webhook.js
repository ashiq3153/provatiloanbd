/**
 * Protected one-time Telegram webhook setup endpoint.
 *
 * Required server-only environment variables:
 * - TELEGRAM_BOT_TOKEN
 * - TELEGRAM_WEBHOOK_SECRET (Telegram webhook header secret)
 * - TELEGRAM_WEBHOOK_SETUP_SECRET (operator authorization secret)
 * - TELEGRAM_WEBHOOK_URL (exact HTTPS production URL, e.g. https://example.com/api/telegram-webhook)
 *
 * Invoke with POST and Authorization: Bearer <TELEGRAM_WEBHOOK_SETUP_SECRET>.
 */
import crypto from "node:crypto";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const SETUP_SECRET = process.env.TELEGRAM_WEBHOOK_SETUP_SECRET;
const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL;

function safeEqual(received, expected) {
  if (typeof received !== "string" || typeof expected !== "string" || !received || !expected) return false;
  const a = Buffer.from(received, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function isValidSecret(value) {
  return typeof value === "string" && value.length >= 32 && value.length <= 256 && /^[A-Za-z0-9_-]+$/.test(value);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const authorization = req.headers.authorization || "";
  const bearer = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!SETUP_SECRET || !safeEqual(bearer, SETUP_SECRET)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!BOT_TOKEN || !WEBHOOK_URL || !isValidSecret(WEBHOOK_SECRET)) {
    return res.status(503).json({ error: "Webhook configuration is incomplete" });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(WEBHOOK_URL);
  } catch {
    return res.status(503).json({ error: "TELEGRAM_WEBHOOK_URL must be a valid HTTPS URL" });
  }
  if (parsedUrl.protocol !== "https:" || parsedUrl.username || parsedUrl.password ||
      !parsedUrl.pathname.endsWith("/api/telegram-webhook") || parsedUrl.search || parsedUrl.hash) {
    return res.status(503).json({ error: "TELEGRAM_WEBHOOK_URL must be an exact HTTPS webhook endpoint" });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        secret_token: WEBHOOK_SECRET,
        allowed_updates: ["message", "my_chat_member"],
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      console.error("Telegram setWebhook failed:", data.description || response.status);
      return res.status(502).json({ error: "Telegram rejected webhook configuration" });
    }
    // Do not echo secrets, bot tokens, or Telegram response internals.
    return res.status(200).json({ success: true, webhookConfigured: true });
  } catch (err) {
    console.error("Webhook setup request failed:", err);
    return res.status(502).json({ error: "Could not reach Telegram API" });
  }
}
