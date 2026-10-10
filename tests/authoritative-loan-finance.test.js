import test from "node:test";
import assert from "node:assert/strict";

import { calculateAuthoritativeLoan } from "../api/loan-finance.js";

function makeSettings(overrides = {}) {
  return {
    procFee: 0.01,
    secDeposit: 0.1,
    insuranceEnabled: false,
    categories: {
      personal: { enabled: true, maxAmount: 2_000_000, minTenure: 12, maxTenure: 180 },
      women: { enabled: false, maxAmount: 500_000, minTenure: 12, maxTenure: 120 },
    },
    ...overrides,
  };
}

function makeRate(monthly_rate = 0.003, calculation_method = "flat") {
  return {
    id: "rate-version-test",
    monthly_rate,
    calculation_method,
  };
}

test("flat calculation is authoritative and rounds money to two decimals", () => {
  const result = calculateAuthoritativeLoan({
    category: "personal",
    amount: 100_000,
    tenureMonths: 12,
    settings: makeSettings(),
    rateVersion: makeRate(0.003, "flat"),
  });

  assert.equal(result.interest_rate, 0.003);
  assert.equal(result.total_interest, 3_600);
  assert.equal(result.total_payable, 103_600);
  assert.equal(result.emi_amount, 8_633.33);
  assert.equal(result.processing_fee, 1_000);
  assert.equal(result.security_deposit, 10_000);
  assert.equal(result.calculation_method, "flat");
  assert.equal(result.rate_version_id, "rate-version-test");
});

test("zero interest still returns principal divided across the tenure", () => {
  const result = calculateAuthoritativeLoan({
    category: "personal",
    amount: 120_000,
    tenureMonths: 12,
    settings: makeSettings(),
    rateVersion: makeRate(0, "flat"),
  });

  assert.equal(result.emi_amount, 10_000);
  assert.equal(result.total_interest, 0);
  assert.equal(result.total_payable, 120_000);
});

test("reducing-balance calculation uses the configured calculation method", () => {
  const result = calculateAuthoritativeLoan({
    category: "personal",
    amount: 100_000,
    tenureMonths: 12,
    settings: makeSettings(),
    rateVersion: makeRate(0.01, "reducing_balance"),
  });

  assert.ok(result.emi_amount > 8_800 && result.emi_amount < 8_900);
  assert.ok(result.total_interest > 5_000 && result.total_interest < 7_000);
  assert.equal(result.calculation_method, "reducing_balance");
});

test("rejects unsupported, disabled, or out-of-range loan categories", () => {
  assert.throws(() => calculateAuthoritativeLoan({
    category: "unknown",
    amount: 100_000,
    tenureMonths: 12,
    settings: makeSettings(),
    rateVersion: makeRate(),
  }), /Unsupported loan category/);

  assert.throws(() => calculateAuthoritativeLoan({
    category: "women",
    amount: 100_000,
    tenureMonths: 12,
    settings: makeSettings(),
    rateVersion: makeRate(),
  }), /not currently available/);
});

test("allows a same-category correction for a category disabled after the original application", () => {
  const result = calculateAuthoritativeLoan({
    category: "women",
    amount: 100_000,
    tenureMonths: 12,
    settings: makeSettings(),
    rateVersion: makeRate(),
    allowDisabledCategory: true,
  });

  assert.equal(result.total_payable, 103_600);
});

test("rejects invalid amount and tenure boundaries", () => {
  const common = {
    category: "personal",
    settings: makeSettings(),
    rateVersion: makeRate(),
  };

  assert.throws(() => calculateAuthoritativeLoan({ ...common, amount: 49_999, tenureMonths: 12 }), /at least 50000/);
  assert.throws(() => calculateAuthoritativeLoan({ ...common, amount: 2_000_001, tenureMonths: 12 }), /category limit/);
  assert.throws(() => calculateAuthoritativeLoan({ ...common, amount: 100_000, tenureMonths: 11 }), /tenure/);
  assert.throws(() => calculateAuthoritativeLoan({ ...common, amount: 100_000, tenureMonths: 181 }), /tenure/);
  assert.throws(() => calculateAuthoritativeLoan({ ...common, amount: 100_000.5, tenureMonths: 12 }), /whole BDT amount/);
});

test("rejects missing/invalid active rates and invalid fee settings", () => {
  const common = {
    category: "personal",
    amount: 100_000,
    tenureMonths: 12,
    settings: makeSettings(),
  };

  assert.throws(() => calculateAuthoritativeLoan({ ...common, rateVersion: null }), /active rate version/);
  assert.throws(() => calculateAuthoritativeLoan({ ...common, rateVersion: makeRate(-0.01) }), /monthly rate/);
  assert.throws(() => calculateAuthoritativeLoan({ ...common, rateVersion: makeRate(0.01, "mystery") }), /calculation method/);
  assert.throws(() => calculateAuthoritativeLoan({
    ...common,
    settings: makeSettings({ procFee: -0.01 }),
    rateVersion: makeRate(),
  }), /fee or deposit rate/);
});

test("fails closed if insurance is enabled before the schema can persist its charge", () => {
  assert.throws(() => calculateAuthoritativeLoan({
    category: "personal",
    amount: 100_000,
    tenureMonths: 12,
    settings: makeSettings({ insuranceEnabled: true }),
    rateVersion: makeRate(),
  }), /no insurance_fee column/);
});
