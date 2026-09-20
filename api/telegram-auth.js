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
  try { const user = JSON.parse(userRaw); return user?.id ? { user, auth_date: authDate } : null; } catch { return null; }
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

/**
 * Sends a single Telegram Bot API message using the server-only bot token.
 * Never exposed to the browser; callers only ever pass chat_id + text.
 */
async function sendTelegramBotMessage(chatId, text, replyMarkup) {
  if (!BOT_TOKEN) throw new Error("Telegram bot token is not configured on the server");
  const numericChatId = Number(chatId);
  const trimmedText = typeof text === "string" ? text.trim() : "";
  if (!numericChatId || !trimmedText) throw new Error("chatId and message are required");
  const body = { chat_id: numericChatId, text: trimmedText, parse_mode: "HTML" };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const tgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const tgData = await tgResponse.json().catch(() => ({}));
  if (!tgResponse.ok || !tgData.ok) throw new Error(tgData.description || "Telegram API request failed");
  return true;
}

async function submitLoanApplication(telegramUser, payload) {
  const db = adminClient();
  const chatId = Number(telegramUser?.id);
  if (!chatId) throw new Error("Invalid Telegram user");
  if (!payload || typeof payload !== "object") throw new Error("Invalid loan payload");
  await syncProfile(telegramUser);

  const allowedFields = [
    "loan_category","amount","tenure_months","interest_rate","emi_amount",
    "processing_fee","security_deposit","full_name","father_name","mother_name",
    "dob","gender","mobile","whatsapp","email","current_address",
    "permanent_address","nid_number","professional_info","bank_name",
    "account_name","account_number","routing_number","mobile_banking",
    "nominee_name","nominee_relation","nominee_mobile","nominee_nid",
    "documents","admin_feedback"
  ];
  const record = { chat_id: chatId, status: "pending" };
  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) record[key] = payload[key];
  }

  const { data, error } = await db.from("loan_applications").insert(record).select().single();
  if (error) throw error;
  return data;
}

async function syncProfile(telegramUser) {
  const db = adminClient();
  const chatId = Number(telegramUser?.id);
  if (!chatId) throw new Error("Invalid Telegram user");
  const profile = {
    chat_id: chatId,
    first_name: String(telegramUser.first_name || "Telegram User"),
    last_name: telegramUser.last_name || null,
    username: telegramUser.username || null,
    photo_url: telegramUser.photo_url || null,
  };
  const { data, error } = await db.from("profiles").upsert(profile, { onConflict: "chat_id" }).select().single();
  if (error) throw error;
  return data;
}

async function adminAction(action, payload) {
  const db = adminClient();
  switch (action) {
    case "get_profiles": return (await db.from("profiles").select("*").order("created_at", { ascending: false })).data || [];
    case "get_loans": return (await db.from("loan_applications").select("*").order("applied_at", { ascending: false })).data || [];
    case "get_transactions": return (await db.from("transactions").select("*").order("created_at", { ascending: false })).data || [];
    case "get_success_stories": return (await db.from("success_stories").select("*").order("rating", { ascending: false })).data || [];
    case "get_system_setting": return (await db.from("system_settings").select("value").eq("key", payload.key).single()).data?.value || null;
    case "ban_user": return !(await db.from("profiles").update({ is_banned: !!payload.isBanned }).eq("chat_id", payload.chatId)).error;
    case "lock_user": return !(await db.from("profiles").update({ is_locked: !!payload.isLocked, lock_reason: payload.isLocked ? (payload.reason || null) : null }).eq("chat_id", payload.chatId)).error;
    case "delete_user":
      for (const table of ["transactions", "loan_applications", "support_messages"]) await db.from(table).delete().eq("chat_id", payload.chatId);
      return !(await db.from("profiles").delete().eq("chat_id", payload.chatId)).error;
    case "update_transaction": return !(await db.from("transactions").update({ status: payload.status }).eq("id", payload.id)).error;
    case "update_loan": {
      if (payload.status === "approved") {
        const { error } = await db.rpc("approve_loan_atomic", { p_loan_id: payload.id, p_feedback: payload.feedback || null });
        if (error) throw error;
        return true;
      }
      return !(await db.from("loan_applications").update({ status: payload.status, admin_feedback: payload.feedback || null, approved_at: null }).eq("id", payload.id)).error;
    }
    case "update_system_setting": {
      const existing = await db.from("system_settings").select("id").eq("key", payload.key).maybeSingle();
      if (existing.data) return !(await db.from("system_settings").update({ value: payload.value }).eq("key", payload.key)).error;
      return !(await db.from("system_settings").insert({ key: payload.key, value: payload.value })).error;
    }
    case "add_success_story": return !(await db.from("success_stories").insert(payload.story)).error;
    case "delete_success_story": return !(await db.from("success_stories").delete().eq("id", payload.id)).error;
    case "get_chat_messages": return (await db.from("support_messages").select("*").order("created_at", { ascending: true })).data || [];
    case "send_chat_message": {
      const { error } = await db.from("support_messages").insert({ chat_id: payload.chatId, sender: "admin", message: payload.message, reply_to: payload.replyTo || null, attachment_url: payload.attachmentUrl || null });
      if (error) throw error;
      return true;
    }
    case "edit_chat_message": return !(await db.from("support_messages").update({ message: payload.message, is_edited: true }).eq("id", payload.id)).error;
    case "mark_chat_seen": return !(await db.from("support_messages").update({ is_seen: true }).in("id", Array.isArray(payload.ids) ? payload.ids : [])).error;
    case "delete_chat_message": return !(await db.from("support_messages").delete().eq("id", payload.id)).error;
    case "send_telegram_message": return await sendTelegramBotMessage(payload.chatId, payload.message, payload.replyMarkup);
    default: throw new Error("Unsupported admin action");
  }
}

async function chatAction(telegramChatId, action, payload) {
  const db = adminClient();
  switch (action) {
    case "get_messages": return (await db.from("support_messages").select("*").eq("chat_id", telegramChatId).order("created_at", { ascending: true })).data || [];
    case "send_message": {
      const message = typeof payload.message === "string" ? payload.message.trim() : "";
      const attachmentUrl = typeof payload.attachmentUrl === "string" ? payload.attachmentUrl : null;
      if (!message && !attachmentUrl) throw new Error("Message or attachment is required");
      const { error } = await db.from("support_messages").insert({ chat_id: telegramChatId, sender: "user", message, reply_to: payload.replyTo || null, attachment_url: attachmentUrl });
      if (error) throw error;
      return true;
    }
    case "mark_seen": {
      const ids = Array.isArray(payload.ids) ? payload.ids.filter(id => typeof id === "string") : [];
      if (!ids.length) return true;
      return !(await db.from("support_messages").update({ is_seen: true }).eq("chat_id", telegramChatId).eq("sender", "admin").in("id", ids)).error;
    }
    default: throw new Error("Unsupported chat action");
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
    if (req.body?.action === "sync_profile") {
      const data = await syncProfile(result.user);
      return res.status(200).json({ ok: true, data });
    }
    if (req.body?.action === "loan" && req.body?.loanAction === "submit") {
      const data = await submitLoanApplication(result.user, req.body.payload || {});
      return res.status(200).json({ ok: true, data });
    }
    if (req.body?.action === "admin") {
      if (!ADMIN_CHAT_IDS.has(String(result.user.id))) return res.status(403).json({ ok: false, error: "Admin access denied" });
      const data = await adminAction(req.body.adminAction, req.body.payload || {});
      return res.status(200).json({ ok: true, data });
    }
    if (req.body?.action === "chat") {
      const data = await chatAction(Number(result.user.id), req.body.chatAction, req.body.payload || {});
      return res.status(200).json({ ok: true, data });
    }
    return res.status(200).json({ ok: true, user: result.user, identityBound: Boolean(req.body?.accessToken) });
  } catch (error) {
    console.error("Telegram authentication error:", error);
    return res.status(400).json({ ok: false, error: "Authentication or server operation failed" });
  }
}
