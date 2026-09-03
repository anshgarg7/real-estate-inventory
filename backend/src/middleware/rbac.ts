import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { AppError } from "../utils/AppError";

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }
    next();
  };
}
