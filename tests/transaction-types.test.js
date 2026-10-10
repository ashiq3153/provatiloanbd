import test from "node:test";
import assert from "node:assert/strict";

import { normalizeUserTransactionType } from "../api/transaction-types.js";

test("accepts the three user transaction types stored by the database", () => {
  assert.equal(normalizeUserTransactionType("deposit"), "deposit");
  assert.equal(normalizeUserTransactionType("withdraw"), "withdraw");
  assert.equal(normalizeUserTransactionType("emi_payment"), "emi_payment");
});

test("normalizes case and whitespace", () => {
  assert.equal(normalizeUserTransactionType(" EMI_PAYMENT "), "emi_payment");
});

test("rejects unsupported and server-only transaction types", () => {
  for (const value of [
    "emi", "disbursement", "completed", "unknown", "", " ",
    null, undefined, 1, {},
  ]) {
    assert.equal(normalizeUserTransactionType(value), null);
  }
});
