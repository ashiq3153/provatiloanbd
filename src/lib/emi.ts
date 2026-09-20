import { calculateLoan } from "./finance";

export interface EmiScheduleRow {
  installmentNo: number;
  dueDate: string;
  principalDue: number;
  interestDue: number;
  totalDue: number;
}

export function buildFlatEmiSchedule(
  principal: number,
  monthlyRate: number,
  tenureMonths: number,
  firstDueDate: Date = new Date()
): EmiScheduleRow[] {
  const result = calculateLoan({ principal, monthlyRate, tenureMonths, method: "flat" });
  const principalPart = principal / Math.max(1, tenureMonths);
  const interestPart = result.totalInterest / Math.max(1, tenureMonths);
  const rows: EmiScheduleRow[] = [];

  for (let i = 1; i <= tenureMonths; i++) {
    const due = new Date(firstDueDate);
    due.setMonth(due.getMonth() + i);
    const principalDue = i === tenureMonths
      ? principal - principalPart * (tenureMonths - 1)
      : principalPart;
    const interestDue = i === tenureMonths
      ? result.totalInterest - interestPart * (tenureMonths - 1)
      : interestPart;

    rows.push({
      installmentNo: i,
      dueDate: due.toISOString().slice(0, 10),
      principalDue: Math.round(principalDue * 100) / 100,
      interestDue: Math.round(interestDue * 100) / 100,
      totalDue: Math.round((principalDue + interestDue) * 100) / 100,
    });
  }
  return rows;
}
