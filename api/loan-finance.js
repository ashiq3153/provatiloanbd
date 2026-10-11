const CATEGORIES = new Set(["personal", "business", "expat", "student", "emergency", "women"]);
const AMOUNT_OPTIONS = new Set([50_000, 100_000, 150_000, 200_000, 300_000, 500_000, 700_000, 1_000_000, 1_500_000, 2_000_000, 2_500_000, 3_000_000, 4_000_000, 5_000_000]);
const TENURE_OPTIONS = new Set([12, 24, 36, 48, 60, 72, 84, 96, 120, 144, 180]);

export class LoanConfigurationError extends Error {
  constructor(message = "Approved loan terms are not configured") {
    super(message);
    this.name = "LoanConfigurationError";
    this.code = "LOAN_CONFIGURATION";
  }
}

function finiteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function money(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function tenureBandForAmount(amount) {
  if (amount <= 50_000) return [12, 24];
  if (amount <= 100_000) return [12, 36];
  if (amount <= 150_000) return [24, 36];
  if (amount <= 200_000) return [24, 48];
  if (amount <= 300_000) return [24, 60];
  if (amount <= 500_000) return [36, 84];
  if (amount <= 700_000) return [36, 96];
  if (amount <= 1_000_000) return [60, 120];
  if (amount <= 1_500_000) return [84, 144];
  if (amount <= 2_500_000) return [84, 180];
  if (amount <= 3_000_000) return [96, 180];
  return [120, 180];
}

/**
 * Calculate terms only from server-loaded settings and the active rate version.
 * Client-submitted fee/rate/EMI fields are deliberately never accepted here.
 */
export function calculateAuthoritativeLoanTerms({ category, amount, tenureMonths, config, rateVersion }) {
  if (!CATEGORIES.has(category)) throw new Error("Unsupported loan category");

  const principal = finiteNumber(amount);
  const months = finiteNumber(tenureMonths);
  if (principal === null || !Number.isInteger(principal) || principal <= 0) {
    throw new Error("Invalid loan amount");
  }
  if (months === null || !Number.isInteger(months) || months <= 0) {
    throw new Error("Invalid loan tenure");
  }
  if (!AMOUNT_OPTIONS.has(principal)) throw new Error("Unsupported loan amount");
  if (!TENURE_OPTIONS.has(months)) throw new Error("Unsupported loan tenure");

  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new LoanConfigurationError();
  }
  const categoryConfig = config.categories?.[category];
  if (!categoryConfig || categoryConfig.enabled !== true) {
    throw new LoanConfigurationError("This loan category is not enabled in approved settings");
  }
  const maxAmount = finiteNumber(categoryConfig.maxAmount);
  const minTenure = finiteNumber(categoryConfig.minTenure);
  const maxTenure = finiteNumber(categoryConfig.maxTenure);
  if (maxAmount === null || maxAmount <= 0 || minTenure === null || maxTenure === null ||
      minTenure <= 0 || maxTenure < minTenure) {
    throw new LoanConfigurationError("The approved category limits are incomplete");
  }
  if (principal < 50_000 || principal > maxAmount) throw new Error("Loan amount is outside the approved category limit");

  const [bandMin, bandMax] = tenureBandForAmount(principal);
  if (months < Math.max(bandMin, minTenure) || months > Math.min(bandMax, maxTenure)) {
    throw new Error("Loan tenure is outside the approved amount/category range");
  }

  const rateKey = `minRate${category[0].toUpperCase()}${category.slice(1)}`;
  const configuredRate = finiteNumber(config[rateKey]);
  const monthlyRate = finiteNumber(rateVersion?.monthly_rate);
  if (configuredRate === null || configuredRate < 0 || monthlyRate === null || monthlyRate < 0 ||
      !rateVersion?.id || rateVersion.loan_category !== category || rateVersion.is_active !== true ||
      Math.abs(configuredRate - monthlyRate) > 1e-9) {
    throw new LoanConfigurationError("The approved rate version is missing or inconsistent");
  }

  const tiers = config.feeTiers;
  const tierValues = [
    tiers?.processingFeeUpTo1m,
    tiers?.processingFeeAbove1m,
    tiers?.securityDepositUpTo500k,
    tiers?.securityDepositAbove500k,
  ].map(finiteNumber);
  if (tierValues.some(v => v === null || v < 0 || v > 1)) {
    throw new LoanConfigurationError("The approved fee tiers are incomplete");
  }
  const [processingUpTo1m, processingAbove1m, depositUpTo500k, depositAbove500k] = tierValues;
  const processingRate = principal <= 1_000_000 ? processingUpTo1m : processingAbove1m;
  const depositRate = principal <= 500_000 ? depositUpTo500k : depositAbove500k;

  const method = rateVersion.calculation_method;
  if (method !== "flat" && method !== "reducing_balance") {
    throw new LoanConfigurationError("The active rate version has an unsupported calculation method");
  }

  let emi;
  let totalInterest;
  if (method === "reducing_balance" && monthlyRate > 0) {
    const factor = Math.pow(1 + monthlyRate, months);
    emi = principal * (monthlyRate * factor) / (factor - 1);
    totalInterest = (emi * months) - principal;
  } else {
    totalInterest = principal * monthlyRate * months;
    emi = (principal + totalInterest) / months;
  }

  const processingFee = principal * processingRate;
  const securityDeposit = principal * depositRate;
  if (![emi, totalInterest, processingFee, securityDeposit].every(Number.isFinite)) {
    throw new LoanConfigurationError("Could not calculate approved loan terms");
  }

  return {
    loan_category: category,
    amount: principal,
    tenure_months: months,
    interest_rate: monthlyRate,
    emi_amount: money(emi),
    processing_fee: money(processingFee),
    security_deposit: money(securityDeposit),
    calculation_method: method,
    rate_version_id: rateVersion.id,
    total_interest: money(totalInterest),
    total_payable: money(principal + totalInterest),
  };
}
