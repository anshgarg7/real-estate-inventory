import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as authService from "../services/auth.service";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json(result);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.me(req.user!.id);
  res.json(result);
});
