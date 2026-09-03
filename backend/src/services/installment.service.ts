import { Installment, Prisma, Role } from "@prisma/client";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";
import { deriveInstallmentStatus } from "../utils/installmentStatus";

interface RequestUser {
  id: string;
  role: Role;
}

function saleAgentFilter(user: RequestUser) {
  return user.role === "AGENT" ? { sale: { agentId: user.id } } : {};
}

async function refreshStatus(installment: Installment): Promise<Installment> {
  if (installment.status === "PAID") return installment;

  const nextStatus = deriveInstallmentStatus(installment.amountDue, installment.amountPaid, installment.dueDate);
  if (nextStatus === installment.status) return installment;

  return prisma.installment.update({ where: { id: installment.id }, data: { status: nextStatus } });
}

export async function listForSale(user: RequestUser, saleId: string) {
  const sale = await prisma.sale.findFirst({ where: { id: saleId, ...saleAgentFilter(user) } });
  if (!sale) throw new AppError("Sale not found", 404);

  const installments = await prisma.installment.findMany({
    where: { saleId },
    orderBy: { sequence: "asc" },
    include: { payments: { orderBy: { paymentDate: "desc" } } },
  });

  return Promise.all(installments.map(refreshStatus));
}

export async function getInstallment(user: RequestUser, id: string) {
  const installment = await prisma.installment.findFirst({
    where: { id, ...saleAgentFilter(user) },
    include: { payments: { orderBy: { paymentDate: "desc" } }, sale: true },
  });
  if (!installment) throw new AppError("Installment not found", 404);
  return refreshStatus(installment);
}

export async function listOverdue(user: RequestUser) {
  const now = new Date();
  const candidates = await prisma.installment.findMany({
    where: {
      dueDate: { lt: now },
      status: { in: ["PENDING", "PARTIAL"] },
      ...saleAgentFilter(user),
    },
    include: { sale: { include: { plot: true, customer: true } } },
    orderBy: { dueDate: "asc" },
  });

  return Promise.all(candidates.map(refreshStatus));
}

export async function updateInstallment(
  user: RequestUser,
  id: string,
  input: Partial<{ dueDate: Date; amountDue: number }>
) {
  const installment = await prisma.installment.findFirst({ where: { id, ...saleAgentFilter(user) } });
  if (!installment) throw new AppError("Installment not found", 404);
  if (installment.status === "PAID") {
    throw new AppError("Cannot modify an installment that is already paid", 409);
  }

  const updated = await prisma.installment.update({ where: { id }, data: input });
  return refreshStatus(updated);
}

export async function addInstallment(
  user: RequestUser,
  saleId: string,
  input: { amountDue: number; dueDate: Date }
) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findFirst({
      where: { id: saleId, ...(user.role === "AGENT" ? { agentId: user.id } : {}) },
      include: { installments: true },
    });
    if (!sale) throw new AppError("Sale not found", 404);
    if (sale.status !== "ACTIVE") {
      throw new AppError(`Cannot modify installments on a ${sale.status.toLowerCase()} sale`, 409);
    }

    const allocated = sale.installments.reduce((sum, i) => sum.plus(i.amountDue), new Prisma.Decimal(0));
    const remaining = sale.totalPrice.minus(allocated);
    const amountDue = new Prisma.Decimal(input.amountDue);
    if (amountDue.greaterThan(remaining)) {
      throw new AppError(
        `Amount exceeds the remaining unallocated balance of ${remaining.toFixed(2)}`,
        400
      );
    }

    const maxSequence = Math.max(...sale.installments.map((i) => i.sequence));
    const created = await tx.installment.create({
      data: {
        saleId,
        type: "INSTALLMENT",
        sequence: maxSequence + 1,
        dueDate: input.dueDate,
        amountDue,
      },
    });

    const count = sale.installments.filter((i) => i.type === "INSTALLMENT").length + 1;
    await tx.sale.update({ where: { id: saleId }, data: { numberOfInstallments: count } });

    return created;
  });
}

export async function removeInstallment(user: RequestUser, id: string) {
  return prisma.$transaction(async (tx) => {
    const installment = await tx.installment.findFirst({
      where: { id, ...saleAgentFilter(user) },
      include: { sale: true },
    });
    if (!installment) throw new AppError("Installment not found", 404);
    if (installment.type === "DOWN_PAYMENT") {
      throw new AppError("The down payment installment cannot be removed", 400);
    }
    if (installment.sale.status !== "ACTIVE") {
      throw new AppError(`Cannot modify installments on a ${installment.sale.status.toLowerCase()} sale`, 409);
    }
    if (installment.amountPaid.greaterThan(0)) {
      throw new AppError("Cannot remove an installment that already has payments recorded", 409);
    }

    await tx.installment.delete({ where: { id } });

    const count = await tx.installment.count({ where: { saleId: installment.saleId, type: "INSTALLMENT" } });
    await tx.sale.update({ where: { id: installment.saleId }, data: { numberOfInstallments: count } });
  });
}
