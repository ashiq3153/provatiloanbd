/**
 * Validates Telegram Mini App initData on the server and can bridge it to
 * the caller's verified Supabase Auth session.
 */

import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;

export function verifyInitData(initData) {
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

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
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

async function bridgeIdentity(telegramChatId, accessToken) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl || typeof accessToken !== "string" || !accessToken) return false;

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || !data?.user?.id) return false;

  const { data: existing, error: lookupError } = await admin
    .from("telegram_identities")
    .select("auth_user_id")
    .eq("telegram_chat_id", telegramChatId)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing && existing.auth_user_id !== data.user.id) return false;

  const { data: existingByAuth, error: authLookupError } = await admin
    .from("telegram_identities")
    .select("telegram_chat_id")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();
  if (authLookupError) throw authLookupError;
  if (existingByAuth && Number(existingByAuth.telegram_chat_id) !== telegramChatId) return false;

  const { error: upsertError } = await admin
    .from("telegram_identities")
    .upsert({ telegram_chat_id: telegramChatId, auth_user_id: data.user.id }, { onConflict: "telegram_chat_id" });
  if (upsertError) throw upsertError;
  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method Not Allowed" });

  try {
    const result = verifyInitData(req.body?.initData);
    if (!result?.user?.id) return res.status(401).json({ ok: false, error: "Invalid Telegram initData" });

    if (req.body?.accessToken) {
      const bridged = await bridgeIdentity(Number(result.user.id), req.body.accessToken);
      if (!bridged) return res.status(401).json({ ok: false, error: "Supabase identity binding failed" });
    }

    return res.status(200).json({ ok: true, user: result.user, identityBound: Boolean(req.body?.accessToken) });
  } catch (error) {
    console.error("Telegram auth validation error:", error);
    return res.status(400).json({ ok: false, error: "Invalid authentication data" });
  }
}
