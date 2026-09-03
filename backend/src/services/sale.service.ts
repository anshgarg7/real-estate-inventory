import { InstallmentFrequency, Prisma, Role, SaleStatus } from "@prisma/client";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";
import { buildInstallmentSchedule, type ScheduleRow } from "../utils/installmentSchedule";

interface RequestUser {
  id: string;
  role: Role;
}

function agentFilter(user: RequestUser) {
  return user.role === "AGENT" ? { agentId: user.id } : {};
}

export async function listSales(user: RequestUser, filters: { status?: SaleStatus }) {
  return prisma.sale.findMany({
    where: { ...agentFilter(user), status: filters.status },
    include: {
      plot: { include: { project: true } },
      customer: true,
      agent: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSale(user: RequestUser, id: string) {
  const sale = await prisma.sale.findFirst({
    where: { id, ...agentFilter(user) },
    include: {
      plot: { include: { project: true } },
      customer: true,
      agent: { select: { id: true, name: true } },
      installments: { orderBy: { sequence: "asc" }, include: { payments: { orderBy: { paymentDate: "desc" } } } },
    },
  });
  if (!sale) throw new AppError("Sale not found", 404);
  return sale;
}

export interface SaleTerms {
  totalPrice: number;
  downPayment: number;
  numberOfInstallments: number;
  installmentFrequency: InstallmentFrequency;
  startDate: Date;
}

export interface CustomInstallmentInput {
  amountDue: number;
  dueDate: Date;
}

export interface CreateSaleInput {
  plotId: string;
  customerId: string;
  agentId: string;
  downPayment: number;
  startDate: Date;
  notes?: string;
  // Auto-generated schedule (even split across numberOfInstallments):
  totalPrice?: number;
  numberOfInstallments?: number;
  installmentFrequency?: InstallmentFrequency;
  // Or a fully custom, hand-entered schedule:
  customInstallments?: CustomInstallmentInput[];
}

export function previewSchedule(terms: SaleTerms) {
  return buildInstallmentSchedule(terms);
}

function resolveSchedule(input: CreateSaleInput): {
  schedule: ScheduleRow[];
  totalPrice: Prisma.Decimal;
  numberOfInstallments: number;
  installmentFrequency: InstallmentFrequency;
} {
  const downPayment = new Prisma.Decimal(input.downPayment);

  if (input.customInstallments && input.customInstallments.length > 0) {
    const rows: ScheduleRow[] = input.customInstallments.map((row, i) => ({
      type: "INSTALLMENT",
      sequence: i + 1,
      dueDate: row.dueDate,
      amountDue: new Prisma.Decimal(row.amountDue),
    }));
    const totalPrice = rows.reduce((sum, r) => sum.plus(r.amountDue), downPayment);
    return {
      schedule: [
        { type: "DOWN_PAYMENT", sequence: 0, dueDate: input.startDate, amountDue: downPayment },
        ...rows,
      ],
      totalPrice,
      numberOfInstallments: rows.length,
      installmentFrequency: input.installmentFrequency ?? "MONTHLY",
    };
  }

  if (!input.totalPrice || !input.numberOfInstallments || !input.installmentFrequency) {
    throw new AppError(
      "Provide either customInstallments or totalPrice, numberOfInstallments and installmentFrequency",
      400
    );
  }

  const schedule = buildInstallmentSchedule({
    totalPrice: input.totalPrice,
    downPayment: input.downPayment,
    numberOfInstallments: input.numberOfInstallments,
    installmentFrequency: input.installmentFrequency,
    startDate: input.startDate,
  });

  return {
    schedule,
    totalPrice: new Prisma.Decimal(input.totalPrice),
    numberOfInstallments: input.numberOfInstallments,
    installmentFrequency: input.installmentFrequency,
  };
}

export async function createSale(input: CreateSaleInput) {
  return prisma.$transaction(async (tx) => {
    const plot = await tx.plot.findUnique({ where: { id: input.plotId } });
    if (!plot) throw new AppError("Plot not found", 404);
    if (plot.status !== "AVAILABLE") {
      throw new AppError(`Plot is not available (current status: ${plot.status})`, 409);
    }

    const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) throw new AppError("Customer not found", 404);

    const { schedule, totalPrice, numberOfInstallments, installmentFrequency } = resolveSchedule(input);

    const sale = await tx.sale.create({
      data: {
        plotId: input.plotId,
        customerId: input.customerId,
        agentId: input.agentId,
        totalPrice,
        downPayment: input.downPayment,
        numberOfInstallments,
        installmentFrequency,
        startDate: input.startDate,
        notes: input.notes,
        installments: {
          create: schedule.map((row) => ({
            type: row.type,
            sequence: row.sequence,
            dueDate: row.dueDate,
            amountDue: row.amountDue,
          })),
        },
      },
      include: { installments: { orderBy: { sequence: "asc" } } },
    });

    await tx.plot.update({ where: { id: input.plotId }, data: { status: "RESERVED" } });

    return sale;
  });
}

export async function cancelSale(user: RequestUser, id: string) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findFirst({ where: { id, ...agentFilter(user) } });
    if (!sale) throw new AppError("Sale not found", 404);
    if (sale.status !== "ACTIVE") {
      throw new AppError(`Only active sales can be cancelled (current status: ${sale.status})`, 409);
    }

    const updated = await tx.sale.update({ where: { id }, data: { status: "CANCELLED" } });
    await tx.plot.update({ where: { id: sale.plotId }, data: { status: "AVAILABLE" } });
    return updated;
  });
}
