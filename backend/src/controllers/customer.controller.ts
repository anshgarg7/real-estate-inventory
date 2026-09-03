import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as customerService from "../services/customer.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  res.json(await customerService.listCustomers(req.query.search as string | undefined));
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  res.json(await customerService.getCustomer(req.params.id));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(await customerService.createCustomer(req.body));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  res.json(await customerService.updateCustomer(req.params.id, req.body));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await customerService.deleteCustomer(req.params.id);
  res.status(204).send();
});
