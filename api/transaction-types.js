const USER_TRANSACTION_TYPES = new Set([
  "deposit",
  "withdraw",
  "emi_payment",
]);

/**
 * User-initiated transaction types accepted by the Telegram-verified API.
 * "disbursement" remains server/admin-only, and "emi" is not a database type.
 */
export function normalizeUserTransactionType(value) {
  if (typeof value !== "string") return null;
  const type = value.trim().toLowerCase();
  return USER_TRANSACTION_TYPES.has(type) ? type : null;
}
