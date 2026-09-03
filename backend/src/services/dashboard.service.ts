import { Prisma, Role } from "@prisma/client";
import prisma from "../config/prisma";

interface RequestUser {
  id: string;
  role: Role;
}

function agentSaleFilter(user: RequestUser) {
  return user.role === "AGENT" ? { agentId: user.id } : {};
}

export async function getSummary(user: RequestUser) {
  const [plotsByStatus, salesByStatus, installments, payments] = await Promise.all([
    prisma.plot.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.sale.groupBy({ by: ["status"], where: agentSaleFilter(user), _count: { _all: true } }),
    prisma.installment.findMany({
      where: { sale: agentSaleFilter(user) },
      select: { amountDue: true, amountPaid: true, status: true, dueDate: true },
    }),
    prisma.payment.findMany({
      where: { installment: { sale: agentSaleFilter(user) } },
      select: { amount: true, paymentDate: true },
      orderBy: { paymentDate: "asc" },
    }),
  ]);

  const totalCollected = payments.reduce((sum, p) => sum.plus(p.amount), new Prisma.Decimal(0));
  const totalOutstanding = installments.reduce(
    (sum, i) => (i.status === "PAID" ? sum : sum.plus(i.amountDue.minus(i.amountPaid))),
    new Prisma.Decimal(0)
  );
  const overdue = installments.filter((i) => i.status === "OVERDUE");
  const overdueAmount = overdue.reduce((sum, i) => sum.plus(i.amountDue.minus(i.amountPaid)), new Prisma.Decimal(0));

  const collectionsByMonth = new Map<string, Prisma.Decimal>();
  for (const p of payments) {
    const key = `${p.paymentDate.getFullYear()}-${String(p.paymentDate.getMonth() + 1).padStart(2, "0")}`;
    collectionsByMonth.set(key, (collectionsByMonth.get(key) ?? new Prisma.Decimal(0)).plus(p.amount));
  }

  return {
    plotsByStatus: plotsByStatus.map((p) => ({ status: p.status, count: p._count._all })),
    salesByStatus: salesByStatus.map((s) => ({ status: s.status, count: s._count._all })),
    totalCollected: totalCollected.toFixed(2),
    totalOutstanding: totalOutstanding.toFixed(2),
    overdueCount: overdue.length,
    overdueAmount: overdueAmount.toFixed(2),
    collectionsByMonth: Array.from(collectionsByMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, amount]) => ({ month, amount: amount.toFixed(2) })),
  };
}
