import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "A record with this value already exists" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Record not found" });
    }
    if (err.code === "P2020") {
      return res.status(400).json({ error: "One of the provided values is too large" });
    }
  }

  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}
