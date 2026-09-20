export type CalculationMethod = "flat" | "reducing_balance";

export interface LoanCalculationInput {
  principal: number;
  monthlyRate: number;
  tenureMonths: number;
  processingFeeRate?: number;
  securityDepositRate?: number;
  insuranceRate?: number;
  insuranceEnabled?: boolean;
  method?: CalculationMethod;
}

export interface LoanCalculation {
  emi: number;
  totalInterest: number;
  totalPayable: number;
  processingFee: number;
  securityDeposit: number;
  insuranceFee: number;
  totalUpfrontFees: number;
}

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateLoan(input: LoanCalculationInput): LoanCalculation {
  const principal = Math.max(0, Number(input.principal) || 0);
  const monthlyRate = Math.max(0, Number(input.monthlyRate) || 0);
  const months = Math.max(1, Math.floor(Number(input.tenureMonths) || 1));
  const method = input.method || "flat";

  let emi = 0;
  let totalInterest = 0;

  if (method === "reducing_balance" && monthlyRate > 0) {
    const factor = Math.pow(1 + monthlyRate, months);
    emi = principal * (monthlyRate * factor) / (factor - 1);
    totalInterest = (emi * months) - principal;
  } else {
    totalInterest = principal * monthlyRate * months;
    emi = (principal + totalInterest) / months;
  }

  const totalPayable = principal + totalInterest;
  const processingFee = principal * Math.max(0, Number(input.processingFeeRate) || 0);
  const securityDeposit = principal * Math.max(0, Number(input.securityDepositRate) || 0);
  const insuranceFee = input.insuranceEnabled
    ? principal * Math.max(0, Number(input.insuranceRate) || 0)
    : 0;

  return {
    emi: money(emi),
    totalInterest: money(totalInterest),
    totalPayable: money(totalPayable),
    processingFee: money(processingFee),
    securityDeposit: money(securityDeposit),
    insuranceFee: money(insuranceFee),
    totalUpfrontFees: money(processingFee + securityDeposit + insuranceFee),
  };
}

export const normalizeMonthlyRatePercent = (percent: number) => Math.max(0, Number(percent) || 0) / 100;
