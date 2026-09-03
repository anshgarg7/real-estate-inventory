import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";

export async function listProjects() {
  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { plots: true } } },
  });
}

export async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: { plots: { orderBy: { plotNumber: "asc" } } },
  });
  if (!project) throw new AppError("Project not found", 404);
  return project;
}

export async function createProject(input: { name: string; location: string; description?: string }) {
  return prisma.project.create({ data: input });
}

export async function updateProject(
  id: string,
  input: Partial<{ name: string; location: string; description: string }>
) {
  return prisma.project.update({ where: { id }, data: input });
}

export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } });
}
