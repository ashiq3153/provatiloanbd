/**
 * Server-side Telegram WebApp authentication, identity binding and admin gateway.
 */
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ADMIN_CHAT_IDS = new Set(String(process.env.TELEGRAM_ADMIN_CHAT_IDS || "").split(",").map(v => v.trim()).filter(Boolean));
const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;

export function verifyInitData(initData) {
  if (!BOT_TOKEN || typeof initData !== "string" || !initData.trim()) return null;
  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  const authDate = Number(params.get("auth_date"));
  if (!receivedHash || !Number.isFinite(authDate)) return null;
  const now = Math.floor(Date.now() / 1000);
  if (authDate > now + 60 || now - authDate > MAX_AUTH_AGE_SECONDS) return null;
  const dataCheckString = [...params.entries()].filter(([key]) => key !== "hash").sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  const expected = Buffer.from(calculatedHash, "hex");
  const received = Buffer.from(receivedHash, "hex");
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;
  const userRaw = params.get("user");
  if (!userRaw) return null;
  try {
    const user = JSON.parse(userRaw);
    return user?.id ? { user, auth_date: authDate } : null;
  } catch { return null; }
}

function adminClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error("Server database credentials are not configured");
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function bridgeIdentity(telegramChatId, accessToken) {
  if (!SERVICE_ROLE_KEY || !SUPABASE_URL || typeof accessToken !== "string" || !accessToken) return false;
  const admin = adminClient();
  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || !data?.user?.id) return false;
  const { data: existing } = await admin.from("telegram_identities").select("auth_user_id").eq("telegram_chat_id", telegramChatId).maybeSingle();
  if (existing && existing.auth_user_id !== data.user.id) return false;
  const { data: existingByAuth } = await admin.from("telegram_identities").select("telegram_chat_id").eq("auth_user_id", data.user.id).maybeSingle();
  if (existingByAuth && Number(existingByAuth.telegram_chat_id) !== telegramChatId) return false;
  const { error: upsertError } = await admin.from("telegram_identities").upsert({ telegram_chat_id: telegramChatId, auth_user_id: data.user.id }, { onConflict: "telegram_chat_id" });
  if (upsertError) throw upsertError;
  return true;
}

async function adminAction(action, payload) {
  const db = adminClient();
  switch (action) {
    case "get_profiles": return (await db.from("profiles").select("*").order("created_at", { ascending: false })).data || [];
    case "get_loans": return (await db.from("loan_applications").select("*").order("applied_at", { ascending: false })).data || [];
    case "get_transactions": return (await db.from("transactions").select("*").order("created_at", { ascending: false })).data || [];
    case "get_success_stories": return (await db.from("success_stories").select("*").order("rating", { ascending: false })).data || [];
    case "get_system_setting": return (await db.from("system_settings").select("value").eq("key", payload.key).single()).data?.value || null;
    case "ban_user": return !!(await db.from("profiles").update({ is_banned: !!payload.isBanned }).eq("chat_id", payload.chatId)).error === false;
    case "lock_user": return !!(await db.from("profiles").update({ is_locked: !!payload.isLocked, lock_reason: payload.isLocked ? (payload.reason || null) : null }).eq("chat_id", payload.chatId)).error === false;
    case "delete_user":
      for (const table of ["transactions", "loan_applications", "support_messages"]) await db.from(table).delete().eq("chat_id", payload.chatId);
      return !!(await db.from("profiles").delete().eq("chat_id", payload.chatId)).error === false;
    case "update_transaction": return !!(await db.from("transactions").update({ status: payload.status }).eq("id", payload.id)).error === false;
    case "update_loan": {
      if (payload.status === "approved") {
        const { error } = await db.rpc("approve_loan_atomic", { p_loan_id: payload.id, p_feedback: payload.feedback || null });
        if (error) throw error;
        return true;
      }
      return !!(await db.from("loan_applications").update({ status: payload.status, admin_feedback: payload.feedback || null, approved_at: null }).eq("id", payload.id)).error === false;
    }
    case "update_system_setting": {
      const existing = await db.from("system_settings").select("id").eq("key", payload.key).maybeSingle();
      if (existing.data) return !!(await db.from("system_settings").update({ value: payload.value }).eq("key", payload.key)).error === false;
      return !!(await db.from("system_settings").insert({ key: payload.key, value: payload.value })).error === false;
    }
    case "add_success_story": return !!(await db.from("success_stories").insert(payload.story)).error === false;
    case "delete_success_story": return !!(await db.from("success_stories").delete().eq("id", payload.id)).error === false;
    default: throw new Error("Unsupported admin action");
  }
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

    if (req.body?.action === "admin") {
      if (!ADMIN_CHAT_IDS.has(String(result.user.id))) return res.status(403).json({ ok: false, error: "Admin access denied" });
      const data = await adminAction(req.body.adminAction, req.body.payload || {});
      return res.status(200).json({ ok: true, data });
    }

    return res.status(200).json({ ok: true, user: result.user, identityBound: Boolean(req.body?.accessToken) });
  } catch (error) {
    console.error("Telegram authentication error:", error);
    return res.status(400).json({ ok: false, error: "Authentication or server operation failed" });
  }
}
