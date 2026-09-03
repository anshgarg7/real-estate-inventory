import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as installmentService from "../services/installment.service";

export const listForSale = asyncHandler(async (req: Request, res: Response) => {
  res.json(await installmentService.listForSale(req.user!, req.params.saleId));
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  res.json(await installmentService.getInstallment(req.user!, req.params.id));
});

export const listOverdue = asyncHandler(async (req: Request, res: Response) => {
  res.json(await installmentService.listOverdue(req.user!));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  res.json(await installmentService.updateInstallment(req.user!, req.params.id, req.body));
});

export const add = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(await installmentService.addInstallment(req.user!, req.params.saleId, req.body));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await installmentService.removeInstallment(req.user!, req.params.id);
  res.status(204).send();
});
