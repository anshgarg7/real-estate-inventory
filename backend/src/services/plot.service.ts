import { PlotStatus } from "@prisma/client";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";

export async function listPlots(filters: { projectId?: string; status?: PlotStatus }) {
  return prisma.plot.findMany({
    where: {
      projectId: filters.projectId,
      status: filters.status,
    },
    include: { project: { select: { id: true, name: true, location: true } } },
    orderBy: [{ projectId: "asc" }, { plotNumber: "asc" }],
  });
}

export async function getPlot(id: string) {
  const plot = await prisma.plot.findUnique({
    where: { id },
    include: { project: true },
  });
  if (!plot) throw new AppError("Plot not found", 404);
  return plot;
}

export async function createPlot(input: {
  projectId: string;
  plotNumber: string;
  block?: string;
  sizeValue: number;
  sizeUnit?: string;
  ratePerUnit: number;
  totalPrice: number;
}) {
  const project = await prisma.project.findUnique({ where: { id: input.projectId } });
  if (!project) throw new AppError("Project not found", 404);

  return prisma.plot.create({ data: input });
}

export async function updatePlot(
  id: string,
  input: Partial<{
    plotNumber: string;
    block: string;
    sizeValue: number;
    sizeUnit: string;
    ratePerUnit: number;
    totalPrice: number;
    status: PlotStatus;
  }>
) {
  return prisma.plot.update({ where: { id }, data: input });
}

export async function deletePlot(id: string) {
  const plot = await prisma.plot.findUnique({ where: { id }, include: { sales: true } });
  if (!plot) throw new AppError("Plot not found", 404);
  if (plot.sales.length > 0) {
    throw new AppError("Cannot delete a plot that has sales recorded against it", 409);
  }
  await prisma.plot.delete({ where: { id } });
}
