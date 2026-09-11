import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

process.env.TELEGRAM_BOT_TOKEN = "test-bot-token-for-unit-tests";

const { verifyInitData } = await import("../api/telegram-auth.js");

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
