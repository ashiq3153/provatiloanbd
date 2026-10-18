import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

process.env.TELEGRAM_BOT_TOKEN = "test-bot-token-for-unit-tests";

const { verifyInitData, resolveAdminRoleFallback, calculateAvailableWithdrawalBalance } = await import("../api/telegram-auth.js");

function buildInitData({ authDate = Math.floor(Date.now() / 1000), user = { id: 7879069458, first_name: "Test" } } = {}) {
  const params = new URLSearchParams();
  params.set("auth_date", String(authDate));
  params.set("query_id", "test-query");
  params.set("user", JSON.stringify(user));

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(process.env.TELEGRAM_BOT_TOKEN)
    .digest();

  const hash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  params.set("hash", hash);
  return params.toString();
}

test("accepts valid Telegram initData", () => {
  const initData = buildInitData();
  const result = verifyInitData(initData);

  assert.equal(result?.user?.id, 7879069458);
  assert.ok(result?.auth_date);
});

test("rejects tampered Telegram initData", () => {
  const initData = buildInitData();
  const tampered = initData.replace("test-query", "tampered-query");

  assert.equal(verifyInitData(tampered), null);
});

test("rejects expired Telegram initData", () => {
  const expiredAuthDate = Math.floor(Date.now() / 1000) - (24 * 60 * 60 + 1);
  const initData = buildInitData({ authDate: expiredAuthDate });

  assert.equal(verifyInitData(initData), null);
});

test("rejects future-dated Telegram initData", () => {
  const futureAuthDate = Math.floor(Date.now() / 1000) + 61;
  const initData = buildInitData({ authDate: futureAuthDate });

  assert.equal(verifyInitData(initData), null);
});

test("rejects missing initData", () => {
  assert.equal(verifyInitData(""), null);
  assert.equal(verifyInitData(undefined), null);
});

test("approved loan amount is available before a payout/disbursement transaction exists", () => {
  const transactions = [];
  const loans = [{ status: "approved", amount: 100000 }];
  assert.equal(calculateAvailableWithdrawalBalance(transactions, loans), 100000);
});

test("legacy disbursement rows are not double-counted with approved loan records", () => {
  const transactions = [
    { type: "disbursement", amount: 100000, status: "completed" },
  ];
  const loans = [{ status: "approved", amount: 100000 }];
  assert.equal(calculateAvailableWithdrawalBalance(transactions, loans), 100000);
});

test("pending and completed withdrawals reserve approved loan funds", () => {
  const transactions = [
    { type: "withdraw", amount: 25000, status: "pending" },
    { type: "withdraw", amount: 10000, status: "completed" },
    { type: "withdraw", amount: 7000, status: "failed" },
    { type: "deposit", amount: 9000, status: "completed" },
  ];
  const loans = [{ status: "approved", amount: 100000 }];
  assert.equal(calculateAvailableWithdrawalBalance(transactions, loans), 65000);
});

test("ineligible and repaid loans do not add available loan funds", () => {
  const loans = [
    { status: "pending", amount: 50000 },
    { status: "rejected", amount: 100000 },
    { status: "completed", amount: 25000 },
    { status: "active", amount: 20000 },
  ];
  assert.equal(calculateAvailableWithdrawalBalance([], loans), 20000);
});

test("available loan balance never becomes negative", () => {
  const transactions = [
    { type: "withdraw", amount: 12000, status: "pending" },
  ];
  const loans = [{ status: "approved", amount: 10000 }];
  assert.equal(calculateAvailableWithdrawalBalance(transactions, loans), 0);
});



test("admin allowlist alone does not grant owner fallback", () => {
  const allowlist = new Set(["111", "222"]);
  assert.equal(resolveAdminRoleFallback(111, allowlist, ""), null);
  assert.equal(resolveAdminRoleFallback(222, allowlist, "111"), null);
});

test("explicit configured owner receives fallback only when allowlisted", () => {
  const allowlist = new Set(["111", "222"]);
  assert.equal(resolveAdminRoleFallback(111, allowlist, "111"), "owner");
  assert.equal(resolveAdminRoleFallback(222, allowlist, "111"), null);
});

test("invalid identities never receive owner fallback", () => {
  const allowlist = new Set(["111"]);
  for (const id of [0, -1, NaN, "not-a-number", 1.5, null]) {
    assert.equal(resolveAdminRoleFallback(id, allowlist, "111"), null);
  }
});
