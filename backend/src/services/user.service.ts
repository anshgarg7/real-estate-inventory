import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";

const publicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listUsers() {
  return prisma.user.findMany({ select: publicSelect, orderBy: { createdAt: "desc" } });
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: publicSelect });
  if (!user) throw new AppError("User not found", 404);
  return user;
}

export async function createUser(input: { name: string; email: string; password: string; role: Role }) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  return prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, role: input.role },
    select: publicSelect,
  });
}

export async function updateUser(
  id: string,
  input: Partial<{ name: string; email: string; role: Role; isActive: boolean; password: string }>
) {
  const data: Record<string, unknown> = { ...input };
  delete data.password;
  if (input.password) {
    data.passwordHash = await bcrypt.hash(input.password, 10);
  }
  return prisma.user.update({ where: { id }, data, select: publicSelect });
}
