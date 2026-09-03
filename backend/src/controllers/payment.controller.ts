import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as paymentService from "../services/payment.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { installmentId, saleId } = req.query as { installmentId?: string; saleId?: string };
  res.json(await paymentService.listPayments(req.user!, { installmentId, saleId }));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentService.recordPayment(req.user!, req.body);
  res.status(201).json(result);
});
