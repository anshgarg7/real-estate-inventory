import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as userService from "../services/user.service";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await userService.listUsers());
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  res.json(await userService.getUser(req.params.id));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(await userService.createUser(req.body));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  res.json(await userService.updateUser(req.params.id, req.body));
});
