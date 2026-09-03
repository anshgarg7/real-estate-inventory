import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";

export async function listCustomers(search?: string) {
  return prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { cnic: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomer(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { sales: { include: { plot: true } } },
  });
  if (!customer) throw new AppError("Customer not found", 404);
  return customer;
}

export async function createCustomer(input: {
  name: string;
  phone: string;
  email?: string;
  cnic?: string;
  address?: string;
}) {
  return prisma.customer.create({ data: input });
}

export async function updateCustomer(
  id: string,
  input: Partial<{ name: string; phone: string; email: string; cnic: string; address: string }>
) {
  return prisma.customer.update({ where: { id }, data: input });
}

export async function deleteCustomer(id: string) {
  const customer = await prisma.customer.findUnique({ where: { id }, include: { sales: true } });
  if (!customer) throw new AppError("Customer not found", 404);
  if (customer.sales.length > 0) {
    throw new AppError("Cannot delete a customer that has sales recorded against them", 409);
  }
  await prisma.customer.delete({ where: { id } });
}
