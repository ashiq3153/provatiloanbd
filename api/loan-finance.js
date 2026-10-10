const ALLOWED_LOAN_CATEGORIES = new Set([
  "personal",
  "business",
  "expat",
  "student",
  "emergency",
  "women",
]);

const MIN_LOAN_AMOUNT = 50_000;

const money = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Recompute money fields from trusted server/database configuration.
 * The frontend may preview these values, but it is never the source of truth.
 */
export function calculateAuthoritativeLoan({
  category,
  amount,
  tenureMonths,
  settings,
  rateVersion,
  allowDisabledCategory = false,
}) {
  const categoryId = String(category || "").trim();

  if (!ALLOWED_LOAN_CATEGORIES.has(categoryId)) {
    throw new Error("Unsupported loan category");
  }

  const categorySettings = settings?.categories?.[categoryId];
  if (!categorySettings || (categorySettings.enabled === false && !allowDisabledCategory)) {
    throw new Error("Loan category is not currently available");
  }

  const principal = Number(amount);
  if (!Number.isSafeInteger(principal) || principal < MIN_LOAN_AMOUNT) {
    throw new Error("Loan amount must be a whole BDT amount of at least 50000");
  }

  const maxAmount = Number(categorySettings.maxAmount);
  if (!Number.isSafeInteger(maxAmount) || maxAmount < MIN_LOAN_AMOUNT || principal > maxAmount) {
    throw new Error("Loan amount is outside the configured category limit");
  }

  const months = Number(tenureMonths);
  const minTenure = Number(categorySettings.minTenure);
  const maxTenure = Number(categorySettings.maxTenure);
  if (
    !Number.isSafeInteger(months) ||
    !Number.isSafeInteger(minTenure) ||
    !Number.isSafeInteger(maxTenure) ||
    minTenure < 1 ||
    maxTenure < minTenure ||
    months < minTenure ||
    months > maxTenure
  ) {
    throw new Error("Loan tenure is outside the configured category limit");
  }

  if (!rateVersion?.id || rateVersion.monthly_rate == null) {
    throw new Error("An active rate version is required for this loan category");
  }
  const monthlyRate = Number(rateVersion.monthly_rate);
  const method = String(rateVersion.calculation_method || "");
  if (!Number.isFinite(monthlyRate) || monthlyRate < 0) {
    throw new Error("The configured monthly rate is invalid");
  }
  if (!["flat", "reducing_balance"].includes(method)) {
    throw new Error("The configured calculation method is invalid");
  }

  const processingFeeRate = Number(settings.procFee);
  const securityDepositRate = Number(settings.secDeposit);
  if (
    settings.procFee == null ||
    settings.secDeposit == null ||
    !Number.isFinite(processingFeeRate) ||
    !Number.isFinite(securityDepositRate) ||
    processingFeeRate < 0 ||
    securityDepositRate < 0
  ) {
    throw new Error("The configured fee or deposit rate is invalid");
  }

  // The current loan_applications schema has no insurance_fee column. Fail
  // closed rather than silently accepting an insurance charge that is not
  // recorded. Add the schema field before enabling insurance for new loans.
  if (settings.insuranceEnabled === true) {
    throw new Error("Insurance is enabled but the loan_applications schema has no insurance_fee column");
  }

  let emi;
  let totalInterest;
  if (method === "reducing_balance" && monthlyRate > 0) {
    const factor = Math.pow(1 + monthlyRate, months);
    const denominator = factor - 1;
    if (!Number.isFinite(factor) || !Number.isFinite(denominator) || denominator <= 0) {
      throw new Error("The configured loan terms cannot be calculated");
    }
    emi = (principal * monthlyRate * factor) / denominator;
    totalInterest = emi * months - principal;
  } else {
    totalInterest = principal * monthlyRate * months;
    emi = (principal + totalInterest) / months;
  }

  if (!Number.isFinite(emi) || !Number.isFinite(totalInterest) || totalInterest < 0) {
    throw new Error("The configured loan terms cannot be calculated");
  }

  return {
    interest_rate: monthlyRate,
    emi_amount: money(emi),
    processing_fee: money(principal * processingFeeRate),
    security_deposit: money(principal * securityDepositRate),
    calculation_method: method,
    rate_version_id: rateVersion.id,
    total_interest: money(totalInterest),
    total_payable: money(principal + totalInterest),
  };
}
