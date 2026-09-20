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

async function checkDuplicateApplication(telegramUser, payload) {
  const db = adminClient();
  const chatId = Number(telegramUser?.id);
  if (!chatId) throw new Error("Invalid Telegram user");
  const fields = [
    ["mobile", payload?.mobile],
    ["email", payload?.email],
    ["account_number", payload?.accountNumber || payload?.account_number],
    ["nominee_nid", payload?.nomineeNid || payload?.nominee_nid],
    ["nid_number", payload?.nidNumber || payload?.nid_number],
  ].filter(([, value]) => typeof value === "string" && value.trim());

  if (!fields.length) return null;

  let query = db.from("loan_applications")
    .select("id,mobile,email,account_number,nominee_nid,nid_number,professional_info,status")
    .eq("chat_id", chatId)
    .in("status", ["pending","under_review","approved","active","action_required"]);

  const { data, error } = await query;
  if (error) throw error;
  if (!data?.length) return null;

  const normalized = value => String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  for (const row of data) {
    if (fields.some(([key, value]) => normalized(row[key]) === normalized(value))) {
      if (fields.some(([key, value]) => key === "mobile" && normalized(row.mobile) === normalized(value))) return "Mobile Number";
      if (fields.some(([key, value]) => key === "email" && normalized(row.email) === normalized(value))) return "Email Address";
      if (fields.some(([key, value]) => key === "account_number" && normalized(row.account_number) === normalized(value))) return "Bank Account Number";
      if (fields.some(([key, value]) => key === "nominee_nid" && normalized(row.nominee_nid) === normalized(value))) return "Nominee NID";
      if (fields.some(([key, value]) => key === "nid_number" && normalized(row.nid_number) === normalized(value))) return "NID Number";
    }
  }
  return null;
}

async function getMyLoanApplications(telegramUser) {
  const db = adminClient();
  const chatId = Number(telegramUser?.id);
  if (!chatId) throw new Error("Invalid Telegram user");
  const { data, error } = await db.from("loan_applications")
    .select("*")
    .eq("chat_id", chatId)
    .order("applied_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function updateMyLoanApplication(telegramUser, applicationId, payload) {
  const db = adminClient();
  const chatId = Number(telegramUser?.id);
  if (!chatId || !applicationId || !payload || typeof payload !== "object") {
    throw new Error("Invalid loan update request");
  }

  const allowedFields = [
    "loan_category","amount","tenure_months","interest_rate","emi_amount",
    "processing_fee","security_deposit","full_name","father_name","mother_name",
    "dob","gender","mobile","whatsapp","email","current_address",
    "permanent_address","nid_number","professional_info","bank_name",
    "account_name","account_number","routing_number","mobile_banking",
    "nominee_name","nominee_relation","nominee_mobile","nominee_nid",
    "documents","admin_feedback"
  ];
  const update = { status: "pending" };
  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) update[key] = payload[key];
  }

  const { data, error } = await db.from("loan_applications")
    .update(update)
    .eq("id", applicationId)
    .eq("chat_id", chatId)
    .select()
    .single();
  if (error) throw error;
  return data;
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

async function createMyTransaction(telegramUser, payload) {
  const db = adminClient();
  const chatId = Number(telegramUser?.id);
  if (!chatId || !payload || typeof payload !== "object") throw new Error("Invalid transaction request");

  const type = String(payload.type || "");
  if (!["deposit", "withdraw", "emi"].includes(type)) throw new Error("Unsupported transaction type");

  const amount = Number(payload.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid transaction amount");

  let loanId = payload.loan_id || null;
  if (loanId) {
    const { data: loan, error: loanError } = await db.from("loan_applications")
      .select("id, chat_id")
      .eq("id", loanId)
      .eq("chat_id", chatId)
      .maybeSingle();
    if (loanError) throw loanError;
    if (!loan) throw new Error("Loan does not belong to this Telegram user");
  }

  const record = {
    chat_id: chatId,
    loan_id: loanId,
    type,
    deposit_type: typeof payload.deposit_type === "string" ? payload.deposit_type : null,
    amount,
    payment_method: typeof payload.payment_method === "string" ? payload.payment_method : null,
    sender_number: typeof payload.sender_number === "string" ? payload.sender_number : null,
    trx_id: typeof payload.trx_id === "string" ? payload.trx_id : null,
    screenshot_url: typeof payload.screenshot_url === "string" ? payload.screenshot_url : null,
    status: "pending"
  };

  const { data, error } = await db.from("transactions").insert(record).select().single();
  if (error) throw error;
  return data;
}

async function getMyTransactions(telegramUser) {
  const db = adminClient();
  const chatId = Number(telegramUser?.id);
  if (!chatId) throw new Error("Invalid Telegram user");
  const { data, error } = await db.from("transactions")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
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

async function getAdminRole(chatId) {
  const { data, error } = await adminClient().rpc("get_admin_role", { p_chat_id: Number(chatId) });
  if (error) throw error;
  return data || null;
}

const ADMIN_ACTION_ROLES = {
  get_financial_report: ["owner","admin","finance","viewer"],
  get_kyc_queue: ["owner","admin","support","viewer"],
  update_kyc_review: ["owner","admin","support"],
  get_notifications: ["owner","admin","support","viewer","finance"],
  mark_notification_read: ["owner","admin","support","viewer","finance"],
  get_kyc_reviews: ["owner","admin","support","viewer","finance"],
  get_profiles: ["owner","admin","support","viewer","finance"],
  get_loans: ["owner","admin","support","viewer","finance"],
  get_transactions: ["owner","admin","finance","viewer"],
  get_success_stories: ["owner","admin","support","viewer"],
  get_system_setting: ["owner","admin","finance","support","viewer"],
  get_admin_role: ["owner","admin","finance","support","viewer"],
  ban_user: ["owner","admin","support"],
  lock_user: ["owner","admin","support"],
  delete_user: ["owner","admin"],
  update_transaction: ["owner","admin","finance"],
  update_loan: ["owner","admin","finance"],
  update_system_setting: ["owner","admin"],
  add_success_story: ["owner","admin","support"],
  delete_success_story: ["owner","admin"],
  get_chat_messages: ["owner","admin","support","viewer"],
  send_chat_message: ["owner","admin","support"],
  edit_chat_message: ["owner","admin","support"],
  mark_chat_seen: ["owner","admin","support","viewer"],
  delete_chat_message: ["owner","admin"],
  send_telegram_message: ["owner","admin","support"],
  broadcast_telegram_message: ["owner","admin","support"]
};

async function adminAction(action, payload) {
  const db = adminClient();
  switch (action) {
    case "get_admin_role": {
      const role = await getAdminRole(payload.chatId || 0);
      return { role };
    }
    case "get_financial_report": {
      const { data, error } = await db.from("financial_reconciliation_summary").select("*").single();
      if (error) throw error;
      return data;
    }
    case "get_kyc_queue": {
      const { data, error } = await db.from("kyc_reviews").select("*").order("submitted_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data || [];
    }
    case "update_kyc_review": {
      const reviewId = String(payload.reviewId || "");
      const status = String(payload.status || "");
      const note = typeof payload.reviewerNote === "string" ? payload.reviewerNote.slice(0, 2000) : null;
      if (!reviewId || !["under_review","verified","rejected","needs_revision"].includes(status)) throw new Error("Invalid KYC review update");
      const { data: review, error: reviewError } = await db.from("kyc_reviews").select("id,chat_id").eq("id", reviewId).single();
      if (reviewError || !review) throw new Error("KYC review not found");
      const { error } = await db.from("kyc_reviews").update({ status, reviewer_chat_id: Number(payload.chatId), reviewer_note: note, reviewed_at: new Date().toISOString() }).eq("id", reviewId);
      if (error) throw error;
      return true;
    }
    case "get_notifications": {
      const { data, error } = await db.from("notifications").select("*").eq("chat_id", Number(payload.chatId)).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data || [];
    }
    case "mark_notification_read": {
      const { error } = await db.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", payload.id).eq("chat_id", Number(payload.chatId));
      if (error) throw error;
      return true;
    }
    case "get_kyc_reviews": {
      const { data, error } = await db.from("kyc_reviews").select("*").eq("chat_id", Number(payload.chatId)).order("submitted_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
    case "get_profiles": return (await db.from("profiles").select("*").order("created_at", { ascending: false })).data || [];
    case "get_loans": return (await db.from("loan_applications").select("*").order("applied_at", { ascending: false })).data || [];
    case "get_transactions": return (await db.from("transactions").select("*").order("created_at", { ascending: false })).data || [];
    case "get_success_stories": return (await db.from("success_stories").select("*").order("rating", { ascending: false })).data || [];
    case "get_system_setting": return (await db.from("system_settings").select("value").eq("key", payload.key).single()).data?.value || null;
    case "ban_user": return !(await db.from("profiles").update({ is_banned: !!payload.isBanned }).eq("chat_id", payload.chatId)).error;
    case "lock_user": return !(await db.from("profiles").update({ is_locked: !!payload.isLocked, lock_reason: payload.isLocked ? (payload.reason || null) : null }).eq("chat_id", payload.chatId)).error;
    case "delete_user":
      for (const table of ["transactions", "loan_applications"]) await db.from(table).delete().eq("chat_id", payload.chatId);
      return !(await db.from("profiles").delete().eq("chat_id", payload.chatId)).error;
    case "update_transaction": {
      const patch = {
        status: payload.status,
        verified_by_chat_id: Number(payload.chatId || 0) || null,
        verified_at: payload.status === "completed" || payload.status === "rejected" ? new Date().toISOString() : null,
        verification_note: typeof payload.verificationNote === "string" ? payload.verificationNote.slice(0, 1000) : null
      };
      const { error } = await db.from("transactions").update(patch).eq("id", payload.id);
      if (error) throw error;
      if (payload.status === "completed") {
        await db.rpc("finalize_completed_transaction", { p_transaction_id: payload.id });
      }
      return true;
    }
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
      const saved = existing.data
        ? !(await db.from("system_settings").update({ value: payload.value }).eq("key", payload.key)).error
        : !(await db.from("system_settings").insert({ key: payload.key, value: payload.value })).error;
      if (!saved) return false;

      if (payload.key === "global_loan_config" && payload.value && typeof payload.value === "object") {
        const rates = [
          ["personal", payload.value.minRatePersonal],
          ["business", payload.value.minRateBusiness],
          ["expat", payload.value.minRateExpat],
          ["student", payload.value.minRateStudent],
          ["emergency", payload.value.minRateEmergency],
          ["women", payload.value.minRateWomen]
        ];
        for (const [category, rate] of rates) {
          if (!Number.isFinite(Number(rate))) continue;
          await db.from("loan_rate_versions")
            .update({ is_active: false, effective_to: new Date().toISOString() })
            .eq("loan_category", category)
            .eq("is_active", true);
          const { error } = await db.from("loan_rate_versions").insert({
            loan_category: category,
            monthly_rate: Number(rate),
            calculation_method: "flat",
            effective_from: new Date().toISOString(),
            is_active: true,
            created_by_chat_id: Number(payload.chatId || 0) || null
          });
          if (error) throw error;
        }
      }
      return true;
    }
    case "add_success_story": return !(await db.from("success_stories").insert(payload.story)).error;
    case "delete_success_story": return !(await db.from("success_stories").delete().eq("id", payload.id)).error;
    case "send_telegram_message": return await sendTelegramBotMessage(payload.chatId, payload.message, payload.replyMarkup);
    case "broadcast_telegram_message": {
      const chatIds = Array.isArray(payload.chatIds) ? payload.chatIds.map(Number).filter(Boolean) : [];
      const message = typeof payload.message === "string" ? payload.message : "";
      if (!chatIds.length || !message.trim()) throw new Error("Broadcast recipients and message are required");
      let delivered = 0, failed = 0;
      for (const chatId of chatIds) {
        try {
          await sendTelegramBotMessage(chatId, message, payload.replyMarkup);
          delivered++;
        } catch (error) {
          failed++;
          console.error("Telegram broadcast delivery failed:", chatId, error?.message || error);
        }
        // Stay comfortably below Telegram Bot API burst limits.
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return { delivered, failed };
    }
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
    if (req.body?.action === "sync_profile") {
      const data = await syncProfile(result.user);
      return res.status(200).json({ ok: true, data });
    }
    if (req.body?.action === "loan" && req.body?.loanAction === "check_duplicate") {
      const duplicate = await checkDuplicateApplication(result.user, req.body.payload || {});
      return res.status(200).json({ ok: true, duplicate });
    }
    if (req.body?.action === "transaction" && req.body?.transactionAction === "create") {
      const data = await createMyTransaction(result.user, req.body.payload || {});
      return res.status(200).json({ ok: true, data });
    }
    if (req.body?.action === "transaction" && req.body?.transactionAction === "get_my_transactions") {
      const data = await getMyTransactions(result.user);
      return res.status(200).json({ ok: true, data });
    }
    if (req.body?.action === "loan" && req.body?.loanAction === "get_my_loans") {
      const data = await getMyLoanApplications(result.user);
      return res.status(200).json({ ok: true, data });
    }
    if (req.body?.action === "loan" && req.body?.loanAction === "update") {
      const data = await updateMyLoanApplication(result.user, req.body.loanId, req.body.payload || {});
      return res.status(200).json({ ok: true, data });
    }
    if (req.body?.action === "loan" && req.body?.loanAction === "submit") {
      const data = await submitLoanApplication(result.user, req.body.payload || {});
      return res.status(200).json({ ok: true, data });
    }
    if (req.body?.action === "user") {
    const db = adminClient();
    const userAction = String(req.body?.userAction || "");
    const userChatId = Number(result.user.id);
    if (!Number.isSafeInteger(userChatId) || userChatId <= 0) throw new Error("Invalid Telegram identity");
    if (userAction === "get_notifications") {
      const { data, error } = await db.from("notifications").select("*").eq("chat_id", userChatId).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    }
    if (userAction === "mark_notification_read") {
      const id = String(req.body?.id || "");
      if (!id) throw new Error("Notification id required");
      const { error } = await db.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id).eq("chat_id", userChatId);
      if (error) throw error;
      return res.status(200).json({ success: true, data: true });
    }
    if (userAction === "get_kyc_reviews") {
      const { data, error } = await db.from("kyc_reviews").select("*").eq("chat_id", userChatId).order("submitted_at", { ascending: false }).limit(50);
      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    }
    throw new Error("Unsupported user action");
  }

  if (req.body?.action === "admin") {
      if (!ADMIN_CHAT_IDS.has(String(result.user.id))) return res.status(403).json({ ok: false, error: "Admin access denied" });
      const adminActionName = String(req.body.adminAction || "unknown");
      const adminRole = await getAdminRole(Number(result.user.id));
      const allowedRoles = ADMIN_ACTION_ROLES[adminActionName] || [];
      if (!adminRole || !allowedRoles.includes(adminRole)) {
        return res.status(403).json({ ok: false, error: "Insufficient admin role permissions" });
      }
      const adminPayload = req.body.payload || {};
      const data = await adminAction(adminActionName, { ...adminPayload, chatId: adminPayload.chatId ?? Number(result.user.id) });

      // Keep an immutable, server-side activity trail without storing secrets or message bodies.
      const activityDetails = {
        result_type: typeof data,
        id: typeof adminPayload.id === "string" ? adminPayload.id : null,
        chat_id: Number.isFinite(Number(adminPayload.chatId)) ? Number(adminPayload.chatId) : null,
        status: typeof adminPayload.status === "string" ? adminPayload.status : null,
        setting_key: typeof adminPayload.key === "string" ? adminPayload.key : null
      };
      const { error: activityError } = await adminClient().from("admin_activity_log").insert({
        admin_chat_id: Number(result.user.id),
        action: adminActionName,
        entity_type: adminActionName.startsWith("update_") ? adminActionName.slice(7) : "admin",
        entity_id: activityDetails.id || activityDetails.chat_id?.toString() || null,
        details: activityDetails
      });
      if (activityError) console.error("Admin activity log failed:", activityError);

      return res.status(200).json({ ok: true, data });
    }
    return res.status(200).json({ ok: true, user: result.user, identityBound: Boolean(req.body?.accessToken) });
  } catch (error) {
    console.error("Telegram authentication error:", error);
    return res.status(400).json({ ok: false, error: "Authentication or server operation failed" });
  }
}
