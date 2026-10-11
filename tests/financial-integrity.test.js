import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

// Load the real production finance module through TypeScript's compiler API.
// This keeps the tests tied to src/lib/finance.ts rather than a copied helper.
const source = await readFile(new URL("../src/lib/finance.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const financeModuleUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
const { calculateLoan, getLoanFeeRates } = await import(financeModuleUrl);

test("production flat-interest calculation uses supplied terms consistently", () => {
  const result = calculateLoan({
    principal: 100_000,
    monthlyRate: 0.01,
    tenureMonths: 10,
    processingFeeRate: 0.02,
    securityDepositRate: 0.04,
  });

  assert.deepEqual(result, {
    emi: 11_000,
    totalInterest: 10_000,
    totalPayable: 110_000,
    processingFee: 2_000,
    securityDeposit: 4_000,
    insuranceFee: 0,
    totalUpfrontFees: 6_000,
  });
});

test("production zero-interest calculation does not add interest", () => {
  const result = calculateLoan({
    principal: 120_000,
    monthlyRate: 0,
    tenureMonths: 12,
    processingFeeRate: 0,
    securityDepositRate: 0,
  });

  assert.equal(result.emi, 10_000);
  assert.equal(result.totalInterest, 0);
  assert.equal(result.totalPayable, 120_000);
});

test("production reducing-balance calculation is finite and amortizes principal plus interest", () => {
  const result = calculateLoan({
    principal: 100_000,
    monthlyRate: 0.01,
    tenureMonths: 12,
    method: "reducing_balance",
  });

  assert.ok(Number.isFinite(result.emi) && result.emi > 0);
  assert.ok(Number.isFinite(result.totalInterest) && result.totalInterest > 0);
  assert.ok(Math.abs(result.emi * 12 - result.totalPayable) < 0.02);
});

test("production fee-rate helper honours explicitly configured fee tiers", () => {
  const rates = getLoanFeeRates(600_000, {
    feeTiers: {
      processingFeeUpTo1m: 0.02,
      processingFeeAbove1m: 0.03,
      securityDepositUpTo500k: 0.04,
      securityDepositAbove500k: 0.05,
    },
  });

  assert.deepEqual(rates, {
    processingFeeRate: 0.02,
    securityDepositRate: 0.05,
  });
});

test("production fee-rate helper returns zero fees below its current minimum threshold", () => {
  assert.deepEqual(getLoanFeeRates(49_999, {}), {
    processingFeeRate: 0,
    securityDepositRate: 0,
  });
});
