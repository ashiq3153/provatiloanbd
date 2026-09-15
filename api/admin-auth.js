import crypto from "node:crypto";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_IDS = new Set(
  String(process.env.TELEGRAM_ADMIN_CHAT_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);

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

  const expected = Buffer.from(calculatedHash, "hex");
  const received = Buffer.from(receivedHash, "hex");
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;

  const userRaw = params.get("user");
  if (!userRaw) return null;

  try {
    const user = JSON.parse(userRaw);
    if (!user?.id) return null;
    return { user, auth_date: authDate };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    if (ADMIN_CHAT_IDS.size === 0) {
      return res.status(503).json({ ok: false, error: "Admin access is not configured" });
    }

    const result = verifyInitData(req.body?.initData);
    const chatId = String(result?.user?.id || "");

    if (!chatId || !ADMIN_CHAT_IDS.has(chatId)) {
      return res.status(403).json({ ok: false, error: "Admin access denied" });
    }

    return res.status(200).json({
      ok: true,
      user: result.user,
      role: "admin",
    });
  } catch (error) {
    console.error("Admin Telegram authentication error:", error);
    return res.status(400).json({ ok: false, error: "Invalid Telegram initData" });
  }
}
