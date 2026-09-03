import { NextFunction, Request, Response } from "express";
import { ZodError, type ZodTypeAny } from "zod";
import { AppError } from "../utils/AppError";

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues
          .map((issue) => `${issue.path.join(".") || "value"}: ${issue.message}`)
          .join("; ");
        next(new AppError(message, 400));
      } else {
        next(err);
      }
    }
  };
}
