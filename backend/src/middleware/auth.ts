import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { verifyToken } from "../utils/jwt";
import prisma from "../config/prisma";

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new AppError("Missing or invalid Authorization header", 401);
    }

    const token = header.slice("Bearer ".length);
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.isActive) {
      throw new AppError("User not found or inactive", 401);
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError("Invalid or expired token", 401));
    }
  }
}
