/**
 * Server-side Telegram WebApp authentication, identity binding and admin gateway.
 */
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { calculateAuthoritativeLoanTerms, LoanConfigurationError } from "./loan-finance.js";
import { normalizeUserPrivateDocumentReference, normalizeUserPrivateDocumentMap } from "./private-documents.js";
import { assertMemberAccountActive, MemberAccountSuspendedError } from "./member-access.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_BOT_TOKEN = process.env.TELEGRAM_ADMIN_BOT_TOKEN;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ADMIN_CHAT_IDS = new Set(String(process.env.TELEGRAM_ADMIN_CHAT_IDS || "").split(",").map(v => v.trim()).filter(Boolean));
const OWNER_CHAT_ID = String(process.env.TELEGRAM_OWNER_CHAT_ID || "").trim();
const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;

function verifyInitDataWithToken(initData, botToken) {
  if (!botToken || typeof initData !== "string" || !initData.trim()) return null;
  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  const authDate = Number(params.get("auth_date"));
  if (!receivedHash || !Number.isFinite(authDate)) return null;
  const now = Math.floor(Date.now() / 1000);
  if (authDate > now + 60 || now - authDate > MAX_AUTH_AGE_SECONDS) return null;
  const dataCheckString = [...params.entries()].filter(([key]) => key !== "hash").sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  const expected = Buffer.from(calculatedHash, "hex");
  const received = Buffer.from(receivedHash, "hex");
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;
  const userRaw = params.get("user");
  if (!userRaw) return null;
  try { const user = JSON.parse(userRaw); return user?.id ? { user, auth_date: authDate } : null; } catch { return null; }
}

export function verifyInitData(initData) {
  const userResult = verifyInitDataWithToken(initData, BOT_TOKEN);
  if (userResult) return { ...userResult, verifiedBot: "user" };
  const adminResult = verifyInitDataWithToken(initData, ADMIN_BOT_TOKEN);
  if (adminResult) return { ...adminResult, verifiedBot: "admin" };
  return null;
}

function adminClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error("Server database credentials are not configured");
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function assertMemberActive(telegramUser) {
  const chatId = Number(telegramUser?.id);
  if (!Number.isSafeInteger(chatId) || chatId <= 0) throw new Error("Invalid Telegram identity");
  const { data, error } = await adminClient()
    .from("profiles")
    .select("is_banned,is_locked")
    .eq("chat_id", chatId)
    .maybeSingle();
  if (error) throw error;
  assertMemberAccountActive(data);
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

async function getMyLoanApplicationById(telegramUser, applicationId) {
  const db = adminClient();
  const chatId = Number(telegramUser?.id);
  const id = String(applicationId || "").trim();
  if (!chatId || !id) throw new Error("Invalid loan application lookup");
  const { data, error } = await db.from("loan_applications")
    .select("*")
    .eq("id", id)
    .eq("chat_id", chatId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function loadAuthoritativeLoanTerms(db, input) {
  const [settingsResult, rateResult] = await Promise.all([
    db.from("system_settings").select("value").eq("key", "global_loan_config").maybeSingle(),
    db.from("loan_rate_versions")
      .select("id,loan_category,monthly_rate,calculation_method,is_active")
      .eq("loan_category", input.category)
      .eq("is_active", true)
      .maybeSingle()
  ]);
  if (settingsResult.error || rateResult.error) {
    throw new Error("Could not verify current approved loan settings");
  }
  return calculateAuthoritativeLoanTerms({
    ...input,
    config: settingsResult.data?.value,
    rateVersion: rateResult.data
  });
}

async function updateMyLoanApplication(telegramUser, applicationId, payload) {
  const db = adminClient();
  const chatId = Number(telegramUser?.id);
  if (!chatId || !applicationId || !payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Invalid loan update request");
  }

  // Read the owner-scoped source values first. Financial outputs below are always
  // recomputed from server settings and the active rate version, never copied from the browser.
  const { data: currentLoan, error: currentLoanError } = await db.from("loan_applications")
    .select("id,chat_id,loan_category,amount,tenure_months")
    .eq("id", applicationId)
    .eq("chat_id", chatId)
    .maybeSingle();
  if (currentLoanError) throw currentLoanError;
  if (!currentLoan) throw new Error("Loan application not found");

  const category = Object.prototype.hasOwnProperty.call(payload, "loan_category") ? payload.loan_category : currentLoan.loan_category;
  const amount = Object.prototype.hasOwnProperty.call(payload, "amount") ? payload.amount : currentLoan.amount;
  const tenureMonths = Object.prototype.hasOwnProperty.call(payload, "tenure_months") ? payload.tenure_months : currentLoan.tenure_months;
  const terms = await loadAuthoritativeLoanTerms(db, { category, amount, tenureMonths });

  const allowedFields = [
    "full_name","father_name","mother_name","dob","gender","mobile","whatsapp","email",
    "current_address","permanent_address","nid_number","professional_info","bank_name",
    "account_name","account_number","routing_number","mobile_banking","nominee_name",
    "nominee_relation","nominee_mobile","nominee_nid","documents"
  ];
  const update = { status: "pending", ...terms };
  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) update[key] = payload[key];
  }
  if (Object.prototype.hasOwnProperty.call(payload, "documents")) {
    update.documents = normalizeUserPrivateDocumentMap(payload.documents, chatId, SUPABASE_URL);
  }

  const { data, error } = await db.from("loan_applications")
    .update(update)
    .eq("id", applicationId)
    .eq("chat_id", chatId)
    .select()
    .single();
  if (error) throw error;

  try {
    await syncProfileDetailsFromLoan(telegramUser, {
      full_name: data.full_name,
      father_name: data.father_name,
      mother_name: data.mother_name,
      dob: data.dob,
      gender: data.gender,
      mobile: data.mobile,
      whatsapp: data.whatsapp,
      email: data.email,
      nid_number: data.nid_number,
      current_address: data.current_address,
      permanent_address: data.permanent_address,
      professional_info: data.professional_info,
      bank_name: data.bank_name,
      account_name: data.account_name,
      account_number: data.account_number,
      routing_number: data.routing_number,
      mobile_banking: data.mobile_banking,
      nominee_name: data.nominee_name,
      nominee_relation: data.nominee_relation,
      nominee_mobile: data.nominee_mobile,
      nominee_nid: data.nominee_nid
    });
  } catch (profileError) {
    console.error("Profile auto-sync after loan revision failed:", profileError);
  }
  return data;
}

async function submitLoanApplication(telegramUser, payload) {
  const db = adminClient();
  const chatId = Number(telegramUser?.id);
  if (!chatId) throw new Error("Invalid Telegram user");
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid loan payload");

  const terms = await loadAuthoritativeLoanTerms(db, {
    category: payload.loan_category,
    amount: payload.amount,
    tenureMonths: payload.tenure_months
  });

  const allowedFields = [
    "full_name","father_name","mother_name","dob","gender","mobile","whatsapp","email",
    "current_address","permanent_address","nid_number","professional_info","bank_name",
    "account_name","account_number","routing_number","mobile_banking","nominee_name",
    "nominee_relation","nominee_mobile","nominee_nid","documents"
  ];
  const record = { chat_id: chatId, status: "pending", ...terms };
  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) record[key] = payload[key];
  }
  if (Object.prototype.hasOwnProperty.call(payload, "documents")) {
    record.documents = normalizeUserPrivateDocumentMap(payload.documents, chatId, SUPABASE_URL);
  }

  // Fail validation before writing profile or application data when approved terms
  // are unavailable or inconsistent.
  await syncProfile(telegramUser);
  const { data, error } = await db.from("loan_applications").insert(record).select().single();
  if (error) throw error;

  try {
    await syncProfileDetailsFromLoan(telegramUser, payload);
  } catch (profileError) {
    console.error("Profile auto-sync after loan submit failed:", profileError);
  }
  return data;
}

async function createMyTransaction(telegramUser, payload) {
  const db = adminClient();
  const chatId = Number(telegramUser?.id);
  if (!chatId || !payload || typeof payload !== "object") throw new Error("Invalid transaction request");

  const requestedType = String(payload.type || "");
  // Database and browser types use "emi_payment"; keep accepting the historical
  // short alias but persist one canonical value for history and reconciliation.
  const type = requestedType === "emi" ? "emi_payment" : requestedType;
  if (!["deposit", "withdraw", "emi_payment"].includes(type)) throw new Error("Unsupported transaction type");

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

  if (type === "withdraw") {
    const [financialResult, loanResult] = await Promise.all([
      db.from("transactions")
        .select("type, deposit_type, amount, status")
        .eq("chat_id", chatId),
      db.from("loan_applications")
        .select("id, amount, status")
        .eq("chat_id", chatId)
        .in("status", ["approved", "active"])
    ]);
    if (financialResult.error) throw financialResult.error;
    if (loanResult.error) throw loanResult.error;
    const financialRows = financialResult.data || [];
    const withdrawableLoans = loanResult.data || [];

    const availableBalance = calculateAvailableWithdrawalBalance(financialRows, withdrawableLoans);
    if (amount > availableBalance) {
      throw new Error("Withdrawal amount exceeds available approved-loan funds");
    }

    const completedDeposits = financialRows.filter(tx => tx.type === "deposit" && tx.status === "completed");
    const hasProcessingFee = completedDeposits.some(tx => String(tx.deposit_type || "").includes("processing_fee"));
    const hasSecurityDeposit = completedDeposits.some(tx => String(tx.deposit_type || "").includes("security_deposit"));
    if (!hasProcessingFee || !hasSecurityDeposit) {
      throw new Error("Processing fee and security deposit must be completed before withdrawal");
    }
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
    screenshot_url: payload.screenshot_url == null || payload.screenshot_url === ""
      ? null
      : normalizeUserPrivateDocumentReference(payload.screenshot_url, chatId, SUPABASE_URL),
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

export function calculateAvailableWithdrawalBalance(transactions = [], loans = []) {
  const records = Array.isArray(transactions) ? transactions : [];
  const eligibleLoans = Array.isArray(loans) ? loans : [];
  // Approval makes the approved amount available; a disbursement/payout is
  // recorded only when a withdrawal is actually paid. Keep legacy
  // disbursement transactions for history, but never double-count them here.
  const approvedLoanFunds = eligibleLoans
    .filter(loan => ["approved", "active"].includes(loan.status))
    .reduce((sum, loan) => sum + Math.max(0, Number(loan.amount || 0)), 0);
  const reservedWithdrawals = records
    .filter(tx => tx.type === "withdraw" && ["pending", "completed"].includes(tx.status))
    .reduce((sum, tx) => sum + Math.max(0, Number(tx.amount || 0)), 0);
  return Math.max(0, approvedLoanFunds - reservedWithdrawals);
}

async function getMyDashboardStats(telegramUser) {
  const db = adminClient();
  const chatId = Number(telegramUser?.id);
  if (!Number.isSafeInteger(chatId) || chatId <= 0) throw new Error("Invalid Telegram identity");

  const [loansResult, transactionsResult] = await Promise.all([
    db.from("loan_applications")
      .select("id,amount,total_payable,status,processing_fee,security_deposit")
      .eq("chat_id", chatId),
    db.from("transactions")
      .select("type,deposit_type,amount,status,loan_id")
      .eq("chat_id", chatId)
  ]);
  if (loansResult.error) throw loansResult.error;
  if (transactionsResult.error) throw transactionsResult.error;

  const loans = loansResult.data || [];
  const transactions = transactionsResult.data || [];
  const approvedStatuses = new Set(["approved", "active", "completed"]);
  const currentLoanStatuses = new Set(["approved", "active"]);
  const approvedLoanTotal = loans
    .filter(loan => approvedStatuses.has(loan.status))
    .reduce((sum, loan) => sum + Number(loan.amount || 0), 0);
  const loanIds = loans.filter(loan => currentLoanStatuses.has(loan.status)).map(loan => loan.id);
  let schedules = [];
  if (loanIds.length) {
    const scheduleResult = await db.from("loan_emi_schedule")
      .select("loan_id,total_due,paid_amount")
      .in("loan_id", loanIds);
    if (scheduleResult.error) throw scheduleResult.error;
    schedules = scheduleResult.data || [];
  }

  const completedEmiPayments = transactions.filter(tx => tx.type === "emi_payment" && tx.status === "completed");
  const loanOutstanding = loans
    .filter(loan => currentLoanStatuses.has(loan.status))
    .reduce((sum, loan) => {
      const loanSchedule = schedules.filter(item => item.loan_id === loan.id);
      if (loanSchedule.length) {
        return sum + loanSchedule.reduce((remaining, item) =>
          remaining + Math.max(0, Number(item.total_due || 0) - Number(item.paid_amount || 0)), 0);
      }
      const paid = completedEmiPayments
        .filter(tx => tx.loan_id === loan.id)
        .reduce((amount, tx) => amount + Number(tx.amount || 0), 0);
      return sum + Math.max(0, Number(loan.total_payable || loan.amount || 0) - paid);
    }, 0);

  const completedDeposits = transactions.filter(tx => tx.type === "deposit" && tx.status === "completed");
  const depositBalance = completedDeposits.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  let savingsBalance = 0;
  let processingFeeTotal = 0;
  const usedLoanIds = new Set();
  for (const tx of completedDeposits) {
    const kind = String(tx.deposit_type || "").toLowerCase();
    const hasSecurity = kind.includes("security_deposit");
    const hasFee = kind.includes("processing_fee");
    if (hasSecurity && hasFee) {
      const amount = Number(tx.amount || 0);
      const loan = (tx.loan_id ? loans.find(row => row.id === tx.loan_id) : null)
        || loans.find(row => !usedLoanIds.has(row.id)
          && Math.abs(Number(row.processing_fee || 0) + Number(row.security_deposit || 0) - amount) < 0.01);
      if (loan && Math.abs(Number(loan.processing_fee || 0) + Number(loan.security_deposit || 0) - amount) < 0.01) {
        processingFeeTotal += Number(loan.processing_fee || 0);
        savingsBalance += Number(loan.security_deposit || 0);
        usedLoanIds.add(loan.id);
      }
    } else {
      if (hasSecurity) savingsBalance += Number(tx.amount || 0);
      if (hasFee) processingFeeTotal += Number(tx.amount || 0);
    }
  }
  const withdrawBalance = transactions
    .filter(tx => tx.type === "withdraw" && tx.status === "completed")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  return {
    // Available funds come from approved loan-credit records, independent of the loan's lifecycle status.
    // Pending withdrawals reserve funds; completed withdrawals permanently reduce what remains available.
    totalBalance: calculateAvailableWithdrawalBalance(transactions, loans),
    depositBalance,
    withdrawBalance,
    savingsBalance,
    securityDepositTotal: savingsBalance,
    processingFeeTotal,
    approvedLoanTotal,
    activeLoansCount: loans.filter(loan => currentLoanStatuses.has(loan.status)).length,
    pendingApplications: loans.filter(loan => loan.status === "pending").length,
    totalOutstanding: loanOutstanding,
    loanOutstanding
  };
}

const PROFILE_DETAIL_KEYS = {
  fullName: 120, fatherName: 120, motherName: 120, dob: 20, gender: 32,
  mobile: 20, whatsapp: 20, email: 254, nidNumber: 40, eTin: 40,
  bloodGroup: 8, maritalStatus: 32, spouseProfession: 120, spouseIncome: 30,
  bankName: 120, accountName: 120, accountNumber: 50, routingNumber: 30,
  mobileBanking: 50, nomineeName: 120, nomineeRelation: 80, nomineeMobile: 20, nomineeNid: 40
};
const PROFILE_ADDRESS_KEYS = [
  "district","upazila","union","village","postCode","houseNo","flatNo",
  "holdingNo","roadNo","ownership","rentAmount","stayDuration"
];

function sanitizeProfileAddress(value) {
  let source = value;
  if (typeof source === "string") {
    try { source = JSON.parse(source); } catch { return null; }
  }
  if (!source || typeof source !== "object" || Array.isArray(source)) return null;
  const result = {};
  for (const key of PROFILE_ADDRESS_KEYS) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      result[key] = typeof source[key] === "string" ? source[key].trim().slice(0, 180) : "";
    }
  }
  return result;
}

function sanitizeProfileDetails(payload, { keepEmpty = true } = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid profile details");
  const result = {};
  for (const [key, maxLength] of Object.entries(PROFILE_DETAIL_KEYS)) {
    if (!Object.prototype.hasOwnProperty.call(payload, key)) continue;
    const value = typeof payload[key] === "string" ? payload[key].trim().slice(0, maxLength) : "";
    if (keepEmpty || value) result[key] = value;
  }
  for (const key of ["currentAddress","permanentAddress"]) {
    if (!Object.prototype.hasOwnProperty.call(payload, key)) continue;
    const value = sanitizeProfileAddress(payload[key]);
    if (value) result[key] = value;
  }
  return result;
}

function profileAddressToText(value) {
  const address = sanitizeProfileAddress(value);
  if (!address) return "";
  return [
    address.houseNo ? "House " + address.houseNo : "",
    address.flatNo ? "Flat " + address.flatNo : "",
    address.holdingNo ? "Holding " + address.holdingNo : "",
    address.roadNo ? "Road " + address.roadNo : "",
    address.village, address.union, address.upazila, address.district,
    address.postCode ? "Post code " + address.postCode : ""
  ].filter(Boolean).join(", ");
}

async function getMyProfile(telegramUser) {
  const db = adminClient();
  const chatId = Number(telegramUser?.id);
  if (!Number.isSafeInteger(chatId) || chatId <= 0) throw new Error("Invalid Telegram identity");
  const { data, error } = await db.from("profiles").select("*").eq("chat_id", chatId).maybeSingle();
  if (error) throw error;
  return data || await syncProfile(telegramUser);
}

async function updateMyProfile(telegramUser, payload) {
  const db = adminClient();
  const chatId = Number(telegramUser?.id);
  if (!Number.isSafeInteger(chatId) || chatId <= 0) throw new Error("Invalid Telegram identity");
  const normalized = sanitizeProfileDetails(payload);
  let { data: existing, error: readError } = await db.from("profiles")
    .select("personal_details").eq("chat_id", chatId).maybeSingle();
  if (readError) throw readError;
  if (!existing) {
    await syncProfile(telegramUser);
    const retry = await db.from("profiles").select("personal_details").eq("chat_id", chatId).single();
    if (retry.error) throw retry.error;
    existing = retry.data;
  }

  const patch = {
    personal_details: { ...(existing?.personal_details || {}), ...normalized }
  };
  if (Object.prototype.hasOwnProperty.call(normalized, "mobile")) patch.phone = normalized.mobile || null;
  if (Object.prototype.hasOwnProperty.call(normalized, "currentAddress")) patch.address = profileAddressToText(normalized.currentAddress) || null;
  if (Object.prototype.hasOwnProperty.call(normalized, "nidNumber")) patch.nid_number = normalized.nidNumber || null;

  const { data, error } = await db.from("profiles").update(patch).eq("chat_id", chatId).select("*").single();
  if (error) throw error;
  return data;
}

async function syncProfileDetailsFromLoan(telegramUser, applicationPayload) {
  const source = applicationPayload || {};
  const addressValue = value => {
    if (typeof value !== "string") return value;
    try { return JSON.parse(value); } catch { return null; }
  };
  const candidate = {
    fullName: source.full_name,
    fatherName: source.father_name,
    motherName: source.mother_name,
    dob: source.dob,
    gender: source.gender,
    mobile: source.mobile,
    whatsapp: source.whatsapp,
    email: source.email,
    nidNumber: source.nid_number,
    currentAddress: addressValue(source.current_address),
    permanentAddress: addressValue(source.permanent_address),
    eTin: source.professional_info?.eTin,
    bloodGroup: source.professional_info?.bloodGroup,
    maritalStatus: source.professional_info?.maritalStatus,
    spouseProfession: source.professional_info?.spouseProfession,
    spouseIncome: source.professional_info?.spouseIncome,
    bankName: source.bank_name,
    accountName: source.account_name,
    accountNumber: source.account_number,
    routingNumber: source.routing_number,
    mobileBanking: source.mobile_banking,
    nomineeName: source.nominee_name,
    nomineeRelation: source.nominee_relation,
    nomineeMobile: source.nominee_mobile,
    nomineeNid: source.nominee_nid
  };
  const normalized = sanitizeProfileDetails(candidate, { keepEmpty: false });
  if (!Object.keys(normalized).length) return null;
  return updateMyProfile(telegramUser, normalized);
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

export function resolveAdminRoleFallback(chatId, adminChatIds = ADMIN_CHAT_IDS, ownerChatId = OWNER_CHAT_ID) {
  const numericChatId = Number(chatId);
  if (!Number.isSafeInteger(numericChatId) || numericChatId <= 0) return null;
  const normalizedId = String(numericChatId);
  if (!adminChatIds.has(normalizedId)) return null;

  // The configured admin allowlist is intentionally single-person. When it
  // contains exactly one valid identity, that same identity is the sole owner;
  // no second environment variable or second person is required. If more than
  // one ID is configured, fail closed unless an explicit owner ID is configured.
  if (adminChatIds.size === 1) return "owner";
  if (ownerChatId && normalizedId === ownerChatId) return "owner";
  return null;
}

async function getAdminRole(chatId) {
  const numericChatId = Number(chatId);
  if (!Number.isSafeInteger(numericChatId) || numericChatId <= 0) return null;
  const { data, error } = await adminClient().rpc("get_admin_role", { p_chat_id: numericChatId });
  if (error) throw error;
  if (data) return data;
  return resolveAdminRoleFallback(numericChatId);
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
  get_repayment_queue: ["owner","admin","finance","viewer"],
  get_transactions: ["owner","admin","finance","viewer"],
  get_success_stories: ["owner","admin","support","viewer"],
  get_system_setting: ["owner","admin","finance","support","viewer"],
  get_admin_role: ["owner","admin","finance","support","viewer"],
  set_admin_status: ["owner","admin"],
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
    case "set_admin_status": {
      const now = new Date().toISOString();
      const { error } = await db.from("admin_status").upsert({
        id: 1,
        is_online: payload.isOnline === true,
        last_seen: now,
        updated_at: now
      }, { onConflict: "id" });
      if (error) throw error;
      return true;
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
    case "get_profiles": {
      const { data, error } = await db.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
    case "get_loans": {
      const { data, error } = await db.from("loan_applications").select("*").order("applied_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
    case "get_repayment_queue": {
      const { data: loanRows, error: loanError } = await db.from("loan_applications")
        .select("*")
        .in("status", ["approved", "active"])
        .order("approved_at", { ascending: false });
      if (loanError) throw loanError;
      const repaymentLoans = loanRows || [];
      if (!repaymentLoans.length) return [];

      const loanIds = repaymentLoans.map(loan => loan.id);
      const [scheduleResult, paymentResult] = await Promise.all([
        db.from("loan_emi_schedule")
          .select("loan_id,total_due,paid_amount,status")
          .in("loan_id", loanIds),
        db.from("transactions")
          .select("loan_id,amount,status")
          .eq("type", "emi_payment")
          .eq("status", "completed")
          .in("loan_id", loanIds)
      ]);
      if (scheduleResult.error) throw scheduleResult.error;
      if (paymentResult.error) throw paymentResult.error;
      const schedules = scheduleResult.data || [];
      const payments = paymentResult.data || [];

      return repaymentLoans.map(loan => {
        const loanSchedules = schedules.filter(item => item.loan_id === loan.id);
        const outstanding = loanSchedules.length
          ? loanSchedules.reduce((sum, item) => {
              if (item.status === "paid" || item.status === "waived") return sum;
              return sum + Math.max(0, Number(item.total_due || 0) - Number(item.paid_amount || 0));
            }, 0)
          : Math.max(0, Number(loan.total_payable || loan.amount || 0) -
              payments.filter(payment => payment.loan_id === loan.id)
                .reduce((sum, payment) => sum + Number(payment.amount || 0), 0));
        return { ...loan, repayment_outstanding: outstanding, emi_schedule_count: loanSchedules.length };
      });
    }
    case "get_transactions": {
      const { data, error } = await db.from("transactions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
    case "get_success_stories": {
      const { data, error } = await db.from("success_stories").select("*").order("rating", { ascending: false });
      if (error) throw error;
      return data || [];
    }
    case "get_system_setting": {
      const { data, error } = await db.from("system_settings").select("value").eq("key", payload.key).maybeSingle();
      if (error) throw error;
      return data?.value ?? null;
    }
    case "ban_user": return !(await db.from("profiles").update({ is_banned: !!payload.isBanned }).eq("chat_id", payload.chatId)).error;
    case "lock_user": return !(await db.from("profiles").update({ is_locked: !!payload.isLocked, lock_reason: payload.isLocked ? (payload.reason || null) : null }).eq("chat_id", payload.chatId)).error;
    case "delete_user": {
      const targetChatId = Number(payload.chatId);
      if (!Number.isSafeInteger(targetChatId) || targetChatId <= 0) throw new Error("Invalid member identity");
      if (ADMIN_CHAT_IDS.has(String(targetChatId))) throw new Error("An allowlisted admin account cannot be deactivated here");
      const { data, error } = await db.from("profiles")
        .update({
          is_locked: true,
          lock_reason: "Deactivated by administrator; financial and audit history retained"
        })
        .eq("chat_id", targetChatId)
        .select("chat_id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Member profile not found");
      return true;
    }
    case "update_transaction": {
      if (!["pending", "completed", "rejected", "failed"].includes(payload.status)) {
        throw new Error("Unsupported transaction status");
      }
      const { data: originalTxn, error: originalTxnError } = await db.from("transactions")
        .select("id,chat_id,type,amount,status")
        .eq("id", payload.id)
        .maybeSingle();
      if (originalTxnError) throw originalTxnError;
      if (!originalTxn) throw new Error("Transaction not found");

      // Confirm the current server-side balance before paying a withdrawal.
      if (originalTxn.type === "withdraw" && payload.status === "completed" && originalTxn.status !== "completed") {
        const { data: financialRows, error: financialError } = await db.from("transactions")
          .select("id,type,amount,status")
          .eq("chat_id", originalTxn.chat_id);
        if (financialError) throw financialError;
        const alreadyReserved = (financialRows || [])
          .filter(tx => tx.type === "withdraw" && ["pending", "completed"].includes(tx.status) && tx.id !== originalTxn.id)
          .reduce((sum, tx) => sum + Math.max(0, Number(tx.amount || 0)), 0);
        const { data: approvedLoans, error: loansError } = await db.from("loan_applications")
          .select("id,amount,status")
          .eq("chat_id", originalTxn.chat_id)
          .in("status", ["approved", "active"]);
        if (loansError) throw loansError;
        const approvedFunds = (approvedLoans || [])
          .reduce((sum, loan) => sum + Math.max(0, Number(loan.amount || 0)), 0);
        if (alreadyReserved + Number(originalTxn.amount || 0) > approvedFunds) {
          throw new Error("Withdrawal exceeds remaining approved-loan funds");
        }
      }

      const patch = {
        status: payload.status,
        verified_by_chat_id: Number(payload.chatId || 0) || null,
        verified_at: payload.status === "completed" || payload.status === "rejected" ? new Date().toISOString() : null,
        verification_note: typeof payload.verificationNote === "string" ? payload.verificationNote.slice(0, 1000) : null
      };
      const { error } = await db.from("transactions").update(patch).eq("id", payload.id);
      if (error) throw error;
      if (payload.status === "completed") {
        const { error: finalizeError } = await db.rpc("finalize_completed_transaction", { p_transaction_id: payload.id });
        if (finalizeError) throw finalizeError;
      }
      if (originalTxn.status !== payload.status && originalTxn.type === "withdraw") {
        const notification = payload.status === "completed"
          ? { title: "উত্তোলন সম্পন্ন", message: "আপনার উত্তোলনের অনুরোধটি সম্পন্ন হয়েছে। পরিমাণ: ৳" + Number(originalTxn.amount || 0).toLocaleString("en-BD") + "।" }
          : ["failed", "rejected"].includes(payload.status)
            ? { title: "উত্তোলন সম্পন্ন হয়নি", message: "আপনার উত্তোলনের অনুরোধটি " + (payload.status === "failed" ? "ব্যর্থ" : "বাতিল") + " হয়েছে। সংরক্ষিত ব্যালেন্স আবার উপলভ্য হয়েছে।" }
            : null;
        if (notification) {
          const { error: notificationError } = await db.from("notifications").insert({
            chat_id: originalTxn.chat_id,
            type: "payment",
            title: notification.title,
            message: notification.message,
            entity_type: "transaction",
            entity_id: originalTxn.id
          });
          if (notificationError) console.error("Could not create withdrawal notification:", notificationError);
        }
      }
      return true;
    }
    case "update_loan": {
      if (!["pending", "under_review", "approved", "active", "completed", "rejected", "action_required", "cancelled"].includes(payload.status)) {
        throw new Error("Unsupported loan status");
      }
      const loanId = String(payload.id || "").trim();
      if (!loanId) throw new Error("Loan id is required");
      const { data: originalLoan, error: loanReadError } = await db.from("loan_applications")
        .select("*")
        .eq("id", loanId)
        .maybeSingle();
      if (loanReadError) throw loanReadError;
      if (!originalLoan) throw new Error("Loan application not found");

      // Keep long-term repayment completion separate from application review/payout.
      if (payload.status === "completed" && originalLoan.status !== "completed") {
        const { data: scheduleRows, error: scheduleError } = await db.from("loan_emi_schedule")
          .select("total_due,paid_amount,status")
          .eq("loan_id", loanId);
        if (scheduleError) throw scheduleError;
        let remaining = 0;
        if ((scheduleRows || []).length) {
          remaining = scheduleRows.reduce((sum, item) => {
            if (item.status === "paid" || item.status === "waived") return sum;
            return sum + Math.max(0, Number(item.total_due || 0) - Number(item.paid_amount || 0));
          }, 0);
        } else {
          const { data: paidRows, error: paidError } = await db.from("transactions")
            .select("amount")
            .eq("loan_id", loanId)
            .eq("type", "emi_payment")
            .eq("status", "completed");
          if (paidError) throw paidError;
          const paidTotal = (paidRows || []).reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
          remaining = Math.max(0, Number(originalLoan.total_payable || originalLoan.amount || 0) - paidTotal);
        }
        if (remaining > 0.01) {
          throw new Error("Cannot mark loan repaid while outstanding installments remain");
        }
      }

      if (payload.status === "approved") {
        const { error } = await db.rpc("approve_loan_atomic", { p_loan_id: loanId, p_feedback: payload.feedback || null });
        if (error) throw error;
      } else {
        const loanPatch = { status: payload.status, admin_feedback: payload.feedback || null };
        if (["pending", "under_review", "rejected", "action_required", "cancelled"].includes(payload.status)) {
          loanPatch.approved_at = null;
        }
        const { error } = await db.from("loan_applications").update(loanPatch).eq("id", loanId);
        if (error) throw error;
      }

      if (originalLoan.status !== payload.status) {
        const amountLabel = Number(originalLoan.amount || 0).toLocaleString("en-BD");
        const categoryLabel = String(originalLoan.loan_category || "লোন");
        const notice = payload.status === "under_review"
          ? { title: "লোন আবেদন রিভিউ হচ্ছে", message: "আপনার " + categoryLabel + " লোন আবেদনটি যাচাই করা হচ্ছে।" }
          : payload.status === "approved"
            ? { title: "লোন আবেদন অনুমোদিত", message: "আপনার " + categoryLabel + " লোন আবেদন অনুমোদিত হয়েছে। অনুমোদিত পরিমাণ: ৳" + amountLabel + "। উত্তোলনের জন্য অ্যাপের Withdraw অপশন ব্যবহার করুন।" }
            : payload.status === "completed"
              ? { title: "লোন পরিশোধ সম্পন্ন", message: "আপনার লোনের সব বকেয়া পরিশোধ সম্পন্ন হয়েছে বলে রেকর্ড করা হয়েছে।" }
              : payload.status === "action_required"
                ? { title: "লোন আবেদনে সংশোধন দরকার", message: "আপনার আবেদন আপডেট করতে হবে। অ্যাপ থেকে অ্যাডমিনের মন্তব্য দেখুন।" }
                : ["rejected", "cancelled"].includes(payload.status)
                  ? { title: "লোন আবেদন বাতিল", message: "আপনার লোন আবেদনটি অনুমোদিত হয়নি বা বাতিল করা হয়েছে।" }
                  : payload.status === "active"
                    ? { title: "লোন বিতরণ শুরু", message: "আপনার লোন এখন সক্রিয়।" }
                    : null;
        if (notice) {
          const { error: notificationError } = await db.from("notifications").insert({
            chat_id: originalLoan.chat_id,
            type: "loan",
            title: notice.title,
            message: notice.message,
            entity_type: "loan",
            entity_id: loanId
          });
          if (notificationError) console.error("Could not create loan notification:", notificationError);
        }
      }
      return true;
    }
    case "update_system_setting": {
      const key = typeof payload.key === "string" ? payload.key.trim() : "";
      if (!key || key.length > 100 || !Object.prototype.hasOwnProperty.call(payload, "value")) {
        throw new Error("Invalid system setting update");
      }

      // This operation runs as one database transaction: configuration and
      // all active category rate versions must save together or not at all.
      if (key === "global_loan_config") {
        const { data, error } = await db.rpc("apply_global_loan_config", {
          p_value: payload.value,
          p_created_by_chat_id: Number(payload.chatId || 0) || null
        });
        if (error) throw error;
        return data === true;
      }

      const existing = await db.from("system_settings").select("id").eq("key", key).maybeSingle();
      if (existing.error) throw existing.error;
      const saved = existing.data
        ? await db.from("system_settings").update({ value: payload.value }).eq("key", key)
        : await db.from("system_settings").insert({ key, value: payload.value });
      if (saved.error) throw saved.error;
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
    // Admin actions must remain usable to unlock accounts; all member-facing API
    // routes enforce the database-backed lock/ban flags before proceeding.
    if (req.body?.action !== "admin") await assertMemberActive(result.user);
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
    if (req.body?.action === "loan" && req.body?.loanAction === "get_my_loan") {
      const data = await getMyLoanApplicationById(result.user, req.body.loanId);
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
    if (userAction === "get_profile") {
      const data = await getMyProfile(result.user);
      return res.status(200).json({ ok: true, data });
    }
    if (userAction === "update_profile") {
      const data = await updateMyProfile(result.user, req.body?.payload || {});
      return res.status(200).json({ ok: true, data });
    }
    if (userAction === "get_dashboard_stats") {
      const data = await getMyDashboardStats(result.user);
      return res.status(200).json({ success: true, data });
    }
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
      // Admin access remains bound to the server-side allowlist and role.\n      // Both the User Bot and Admin Bot signatures are accepted here so an existing\n      // admin session cannot lose database access merely because the Mini App was\n      // launched from the other configured Telegram bot.\n      if (!ADMIN_CHAT_IDS.has(String(result.user.id))) return res.status(403).json({ ok: false, error: "Admin access denied" });
      const adminActionName = String(req.body.adminAction || "unknown");
      const adminRole = await getAdminRole(Number(result.user.id));
      const allowedRoles = ADMIN_ACTION_ROLES[adminActionName] || [];
      if (!adminRole || !allowedRoles.includes(adminRole)) {
        return res.status(403).json({ ok: false, error: "Insufficient admin role permissions" });
      }
      const adminPayload = req.body.payload || {};
      const data = await adminAction(adminActionName, { ...adminPayload, chatId: adminPayload.chatId ?? Number(result.user.id) });

      // Keep an immutable, server-side activity trail without storing secrets or message bodies.
      // The recurring online-presence heartbeat is intentionally excluded to avoid log noise.
      if (adminActionName !== "set_admin_status") {
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
      }

      return res.status(200).json({ ok: true, data });
    }
    return res.status(200).json({ ok: true, user: result.user, identityBound: Boolean(req.body?.accessToken) });
  } catch (error) {
    if (error instanceof MemberAccountSuspendedError || error?.code === "ACCOUNT_SUSPENDED") {
      return res.status(403).json({ ok: false, error: error.message });
    }
    if (error?.code === "LOAN_CONFIGURATION" || error instanceof LoanConfigurationError) {
      return res.status(409).json({ ok: false, error: error.message });
    }
    console.error("Telegram authentication error:", error);
    return res.status(400).json({ ok: false, error: "Authentication or server operation failed" });
  }
}
