import { Request, Response } from "express";
import { PlotStatus } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler";
import * as plotService from "../services/plot.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, status } = req.query as { projectId?: string; status?: PlotStatus };
  res.json(await plotService.listPlots({ projectId, status }));
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  res.json(await plotService.getPlot(req.params.id));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(await plotService.createPlot(req.body));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  res.json(await plotService.updatePlot(req.params.id, req.body));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await plotService.deletePlot(req.params.id);
  res.status(204).send();
});
