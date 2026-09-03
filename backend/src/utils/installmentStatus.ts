import { InstallmentStatus, Prisma } from "@prisma/client";

export function deriveInstallmentStatus(
  amountDue: Prisma.Decimal,
  amountPaid: Prisma.Decimal,
  dueDate: Date,
  now: Date = new Date()
): InstallmentStatus {
  if (amountPaid.greaterThanOrEqualTo(amountDue)) {
    return "PAID";
  }
  if (amountPaid.greaterThan(0)) {
    return dueDate < now ? "OVERDUE" : "PARTIAL";
  }
  return dueDate < now ? "OVERDUE" : "PENDING";
}
