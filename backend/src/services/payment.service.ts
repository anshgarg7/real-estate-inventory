import { Installment, PaymentMethod, Prisma, Role } from "@prisma/client";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";
import { deriveInstallmentStatus } from "../utils/installmentStatus";

interface RequestUser {
  id: string;
  role: Role;
}

function saleAgentFilter(user: RequestUser) {
  return user.role === "AGENT" ? { installment: { sale: { agentId: user.id } } } : {};
}

export async function listPayments(user: RequestUser, filters: { installmentId?: string; saleId?: string }) {
  return prisma.payment.findMany({
    where: {
      ...saleAgentFilter(user),
      installmentId: filters.installmentId,
      installment: filters.saleId
        ? { saleId: filters.saleId, ...(user.role === "AGENT" ? { sale: { agentId: user.id } } : {}) }
        : undefined,
    },
    include: { recordedBy: { select: { id: true, name: true } } },
    orderBy: { paymentDate: "desc" },
  });
}

export interface RecordPaymentInput {
  installmentId: string;
  amount: number;
  method: PaymentMethod;
  receiptNumber?: string;
  notes?: string;
  paymentDate?: Date;
}

export async function recordPayment(user: RequestUser, input: RecordPaymentInput) {
  return prisma.$transaction(async (tx) => {
    const installment = await tx.installment.findUnique({
      where: { id: input.installmentId },
      include: { sale: { include: { installments: { orderBy: { sequence: "asc" } } } } },
    });
    if (!installment) throw new AppError("Installment not found", 404);
    if (installment.status === "PAID") {
      throw new AppError("This installment is already fully paid", 409);
    }

    const amount = new Prisma.Decimal(input.amount);
    if (amount.lessThanOrEqualTo(0)) {
      throw new AppError("Payment amount must be greater than zero", 400);
    }

    const remaining = installment.amountDue.minus(installment.amountPaid);
    const overflow = Prisma.Decimal.max(amount.minus(remaining), 0);

    const updatedInstallments: Installment[] = [];

    // An overpayment doesn't spawn extra payment records on later installments —
    // it raises this installment's amount due to match what was actually paid,
    // and shrinks the amount due on subsequent (unpaid) installments by the same
    // amount, so the schedule's total never changes.
    if (overflow.greaterThan(0)) {
      const subsequent = installment.sale.installments.filter(
        (i) => i.sequence > installment.sequence && i.status !== "PAID"
      );

      let toAbsorb = overflow;
      for (const next of subsequent) {
        if (toAbsorb.lessThanOrEqualTo(0)) break;

        const reducible = next.amountDue.minus(next.amountPaid);
        if (reducible.lessThanOrEqualTo(0)) continue;

        const reduceBy = Prisma.Decimal.min(toAbsorb, reducible);
        const newAmountDue = next.amountDue.minus(reduceBy);
        const newStatus = deriveInstallmentStatus(newAmountDue, next.amountPaid, next.dueDate);

        const updated = await tx.installment.update({
          where: { id: next.id },
          data: { amountDue: newAmountDue, status: newStatus },
        });
        updatedInstallments.push(updated);

        toAbsorb = toAbsorb.minus(reduceBy);
      }

      if (toAbsorb.greaterThan(0)) {
        throw new AppError(
          `Payment amount exceeds the total remaining balance across all installments by ${toAbsorb.toFixed(2)}`,
          400
        );
      }
    }

    const newAmountDue = installment.amountDue.plus(overflow);
    const newAmountPaid = installment.amountPaid.plus(amount);
    const newStatus = deriveInstallmentStatus(newAmountDue, newAmountPaid, installment.dueDate);

    const payment = await tx.payment.create({
      data: {
        installmentId: installment.id,
        amount,
        method: input.method,
        receiptNumber: input.receiptNumber,
        notes: input.notes,
        paymentDate: input.paymentDate ?? new Date(),
        recordedById: user.id,
      },
    });

    const updatedTarget = await tx.installment.update({
      where: { id: installment.id },
      data: { amountDue: newAmountDue, amountPaid: newAmountPaid, status: newStatus },
    });
    updatedInstallments.unshift(updatedTarget);

    const allInstallments = installment.sale.installments.map(
      (i) => updatedInstallments.find((u) => u.id === i.id) ?? i
    );
    const saleFullyPaid = allInstallments.every((i) => i.status === "PAID");

    let saleCompleted = false;
    if (saleFullyPaid && installment.sale.status === "ACTIVE") {
      await tx.sale.update({ where: { id: installment.sale.id }, data: { status: "COMPLETED" } });
      await tx.plot.update({ where: { id: installment.sale.plotId }, data: { status: "SOLD" } });
      saleCompleted = true;
    }

    return { payment, installments: updatedInstallments, saleCompleted };
  });
}
