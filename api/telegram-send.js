/**
 * Server-side Telegram Bot API proxy.
 * The bot token MUST stay in Vercel server environment variables.
 *
 * For Mini App-originated requests, the caller's raw Telegram initData is
 * verified server-side and chat_id must match the verified Telegram user.
 */

import crypto from "node:crypto";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;

function verifyInitData(initData) {
  if (!BOT_TOKEN || typeof initData !== "string" || !initData.trim()) return null;

  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  const authDate = Number(params.get("auth_date"));
  if (!receivedHash || !Number.isFinite(authDate)) return null;

  const now = Math.floor(Date.now() / 1000);
  if (authDate > now + 60 || now - authDate > MAX_AUTH_AGE_SECONDS) return null;

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(BOT_TOKEN)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  let expected;
  let received;
  try {
    expected = Buffer.from(calculatedHash, "hex");
    received = Buffer.from(receivedHash, "hex");
  } catch {
    return null;
  }

  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    return null;
  }

  const userRaw = params.get("user");
  if (!userRaw) return null;

  try {
    const user = JSON.parse(userRaw);
    return user?.id ? { user, auth_date: authDate } : null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  if (!BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not configured on the server");
    return res.status(500).json({ ok: false, error: "Telegram service is not configured" });
  }

  try {
    const { chat_id, text, reply_markup, initData } = req.body || {};

    if (!chat_id || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ ok: false, error: "chat_id and text are required" });
    }

    const verified = verifyInitData(initData);
    if (!verified) {
      return res.status(401).json({ ok: false, error: "Unauthorized Telegram request" });
    }

    if (String(verified.user.id) !== String(chat_id)) {
      return res.status(403).json({ ok: false, error: "chat_id does not match Telegram user" });
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
