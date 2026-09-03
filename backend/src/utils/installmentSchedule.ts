import { InstallmentFrequency, InstallmentType, Prisma } from "@prisma/client";

const { Decimal } = Prisma;

export interface ScheduleInput {
  totalPrice: Prisma.Decimal | number | string;
  downPayment: Prisma.Decimal | number | string;
  numberOfInstallments: number;
  installmentFrequency: InstallmentFrequency;
  startDate: Date;
}

export interface ScheduleRow {
  type: InstallmentType;
  sequence: number;
  dueDate: Date;
  amountDue: Prisma.Decimal;
}

function addPeriod(date: Date, frequency: InstallmentFrequency, periods: number): Date {
  const result = new Date(date);
  const monthsPerPeriod = frequency === "MONTHLY" ? 1 : frequency === "QUARTERLY" ? 3 : 12;
  result.setMonth(result.getMonth() + monthsPerPeriod * periods);
  return result;
}

export function buildInstallmentSchedule(input: ScheduleInput): ScheduleRow[] {
  const totalPrice = new Decimal(input.totalPrice);
  const downPayment = new Decimal(input.downPayment);
  const { numberOfInstallments, installmentFrequency, startDate } = input;

  if (numberOfInstallments < 1) {
    throw new Error("numberOfInstallments must be at least 1");
  }
  if (downPayment.greaterThan(totalPrice)) {
    throw new Error("downPayment cannot exceed totalPrice");
  }

  const rows: ScheduleRow[] = [
    { type: "DOWN_PAYMENT", sequence: 0, dueDate: new Date(startDate), amountDue: downPayment },
  ];

  const remaining = totalPrice.minus(downPayment);
  const base = remaining.dividedBy(numberOfInstallments).toDecimalPlaces(2, Decimal.ROUND_DOWN);
  const allocated = base.times(numberOfInstallments - 1);
  const last = remaining.minus(allocated);

  for (let i = 1; i <= numberOfInstallments; i++) {
    rows.push({
      type: "INSTALLMENT",
      sequence: i,
      dueDate: addPeriod(startDate, installmentFrequency, i),
      amountDue: i === numberOfInstallments ? last : base,
    });
  }

  return rows;
}
