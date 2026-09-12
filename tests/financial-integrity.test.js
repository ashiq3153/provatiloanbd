import test from "node:test";
import assert from "node:assert/strict";

// Pure regression tests for financial invariants. These do not touch production data.
function flatInterestEmi(amount, rate, tenure) {
  if (tenure <= 0 || amount <= 0) throw new Error("invalid loan terms");
  if (rate === 0) return amount / tenure;
  return (amount + amount * rate * tenure) / tenure;
}

test("rejects non-positive loan amount", () => {
  assert.throws(() => flatInterestEmi(0, 0.01, 12), /invalid loan terms/);
  assert.throws(() => flatInterestEmi(-1, 0.01, 12), /invalid loan terms/);
});

test("rejects non-positive tenure", () => {
  assert.throws(() => flatInterestEmi(100000, 0.01, 0), /invalid loan terms/);
  assert.throws(() => flatInterestEmi(100000, 0.01, -1), /invalid loan terms/);
});

test("zero-interest EMI equals principal divided by tenure", () => {
  assert.equal(flatInterestEmi(120000, 0, 12), 10000);
});

test("flat-interest EMI is deterministic", () => {
  assert.equal(flatInterestEmi(100000, 0.01, 10), 11000);
});
