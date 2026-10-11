/**
 * Protected setup endpoint for the dedicated Admin Bot webhook.
 *
 * Required server-only environment variables:
 * - TELEGRAM_ADMIN_BOT_TOKEN
 * - TELEGRAM_ADMIN_WEBHOOK_SECRET
 * - TELEGRAM_ADMIN_WEBHOOK_SETUP_SECRET
 * - TELEGRAM_ADMIN_WEBHOOK_URL (exact HTTPS /api/telegram-admin-webhook URL)
 *
 * Invoke with POST and Authorization: Bearer <TELEGRAM_ADMIN_WEBHOOK_SETUP_SECRET>.
 */
import crypto from "node:crypto";

const ADMIN_BOT_TOKEN = process.env.TELEGRAM_ADMIN_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_ADMIN_WEBHOOK_SECRET;
const SETUP_SECRET = process.env.TELEGRAM_ADMIN_WEBHOOK_SETUP_SECRET;
const WEBHOOK_URL = process.env.TELEGRAM_ADMIN_WEBHOOK_URL;

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

  if (!ADMIN_BOT_TOKEN || !WEBHOOK_URL || !isValidSecret(WEBHOOK_SECRET)) {
    return res.status(503).json({ error: "Admin webhook configuration is incomplete" });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(WEBHOOK_URL);
  } catch {
    return res.status(503).json({ error: "TELEGRAM_ADMIN_WEBHOOK_URL must be a valid HTTPS URL" });
  }
  if (
    parsedUrl.protocol !== "https:" ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.pathname !== "/api/telegram-admin-webhook" ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    return res.status(503).json({ error: "TELEGRAM_ADMIN_WEBHOOK_URL must be the exact HTTPS Admin Bot endpoint" });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        secret_token: WEBHOOK_SECRET,
        allowed_updates: ["message"],
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      console.error("Telegram Admin Bot setWebhook failed:", data.description || response.status);
      return res.status(502).json({ error: "Telegram rejected Admin Bot webhook configuration" });
    }
    return res.status(200).json({ success: true, adminWebhookConfigured: true });
  } catch (error) {
    console.error("Admin Bot webhook setup request failed:", error);
    return res.status(502).json({ error: "Could not reach Telegram API" });
  }
}
