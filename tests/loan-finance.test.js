import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateAuthoritativeLoanTerms,
  LoanConfigurationError,
} from "../api/loan-finance.js";

function settings(overrides = {}) {
  return {
    minRatePersonal: 0.01,
    feeTiers: {
      processingFeeUpTo1m: 0.02,
      processingFeeAbove1m: 0.03,
      securityDepositUpTo500k: 0.04,
      securityDepositAbove500k: 0.05,
    },
    categories: {
      personal: { enabled: true, maxAmount: 500000, minTenure: 12, maxTenure: 60 },
    },
    ...overrides,
  };
}

function activeRate(overrides = {}) {
  return {
    id: "rate-version-1",
    loan_category: "personal",
    monthly_rate: 0.01,
    calculation_method: "flat",
    is_active: true,
    ...overrides,
  };
}

test("server calculator derives every financial output from approved settings", () => {
  const terms = calculateAuthoritativeLoanTerms({
    category: "personal",
    amount: 100000,
    tenureMonths: 12,
    config: settings(),
    rateVersion: activeRate(),
  });

  assert.deepEqual(terms, {
    loan_category: "personal",
    amount: 100000,
    tenure_months: 12,
    interest_rate: 0.01,
    emi_amount: 9333.33,
    processing_fee: 2000,
    security_deposit: 4000,
    calculation_method: "flat",
    rate_version_id: "rate-version-1",
    total_interest: 12000,
    total_payable: 112000,
  });
});

test("server calculator fails closed when approved settings are absent", () => {
  assert.throws(
    () => calculateAuthoritativeLoanTerms({
      category: "personal",
      amount: 100000,
      tenureMonths: 12,
      config: {},
      rateVersion: null,
    }),
    error => error instanceof LoanConfigurationError && error.code === "LOAN_CONFIGURATION",
  );
});

test("server calculator rejects a disabled category", () => {
  assert.throws(
    () => calculateAuthoritativeLoanTerms({
      category: "personal",
      amount: 100000,
      tenureMonths: 12,
      config: settings({ categories: { personal: { enabled: false, maxAmount: 500000, minTenure: 12, maxTenure: 60 } } }),
      rateVersion: activeRate(),
    }),
    /not enabled/,
  );
});

test("server calculator rejects rate/config disagreement", () => {
  assert.throws(
    () => calculateAuthoritativeLoanTerms({
      category: "personal",
      amount: 100000,
      tenureMonths: 12,
      config: settings(),
      rateVersion: activeRate({ monthly_rate: 0.02 }),
    }),
    error => error instanceof LoanConfigurationError,
  );
});

test("server calculator rejects client-controlled amount or tenure outside allowed choices", () => {
  const base = {
    category: "personal",
    config: settings(),
    rateVersion: activeRate(),
  };
  assert.throws(() => calculateAuthoritativeLoanTerms({ ...base, amount: 100001, tenureMonths: 12 }), /Unsupported loan amount/);
  assert.throws(() => calculateAuthoritativeLoanTerms({ ...base, amount: 100000, tenureMonths: 13 }), /Unsupported loan tenure/);
  assert.throws(() => calculateAuthoritativeLoanTerms({ ...base, amount: 700000, tenureMonths: 12 }), /approved category limit/);
});
