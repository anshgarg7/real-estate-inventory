import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as dashboardService from "../services/dashboard.service";

export const summary = asyncHandler(async (req: Request, res: Response) => {
  res.json(await dashboardService.getSummary(req.user!));
});
