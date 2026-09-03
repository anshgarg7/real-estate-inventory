import { Request, Response } from "express";
import { SaleStatus } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler";
import * as saleService from "../services/sale.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query as { status?: SaleStatus };
  res.json(await saleService.listSales(req.user!, { status }));
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  res.json(await saleService.getSale(req.user!, req.params.id));
});

export const preview = asyncHandler(async (req: Request, res: Response) => {
  res.json(saleService.previewSchedule(req.body));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const agentId = req.user!.role === "AGENT" ? req.user!.id : req.body.agentId ?? req.user!.id;
  const sale = await saleService.createSale({ ...req.body, agentId });
  res.status(201).json(sale);
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  res.json(await saleService.cancelSale(req.user!, req.params.id));
});
