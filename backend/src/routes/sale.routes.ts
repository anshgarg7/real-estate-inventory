import { Router } from "express";
import { z } from "zod";
import { InstallmentFrequency, SaleStatus } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import * as saleController from "../controllers/sale.controller";

const router = Router();

const termsSchema = z.object({
  totalPrice: z.number().positive(),
  downPayment: z.number().nonnegative(),
  numberOfInstallments: z.number().int().positive(),
  installmentFrequency: z.nativeEnum(InstallmentFrequency),
  startDate: z.coerce.date(),
});

const customInstallmentSchema = z.object({
  amountDue: z.number().positive(),
  dueDate: z.coerce.date(),
});

const createSchema = z
  .object({
    plotId: z.string().uuid(),
    customerId: z.string().uuid(),
    agentId: z.string().uuid().optional(),
    downPayment: z.number().nonnegative(),
    startDate: z.coerce.date(),
    notes: z.string().optional(),
    totalPrice: z.number().positive().optional(),
    numberOfInstallments: z.number().int().positive().optional(),
    installmentFrequency: z.nativeEnum(InstallmentFrequency).optional(),
    customInstallments: z.array(customInstallmentSchema).min(1).optional(),
  })
  .refine(
    (data) =>
      (data.customInstallments && data.customInstallments.length > 0) ||
      (data.totalPrice !== undefined && data.numberOfInstallments !== undefined && data.installmentFrequency !== undefined),
    {
      message:
        "Provide either customInstallments (at least one row) or totalPrice, numberOfInstallments and installmentFrequency",
    }
  );

const listQuerySchema = z.object({
  status: z.nativeEnum(SaleStatus).optional(),
});

router.use(authenticate);

router.get("/", validate({ query: listQuerySchema }), saleController.list);
router.get("/:id", saleController.get);
router.post("/preview", validate({ body: termsSchema }), saleController.preview);
router.post("/", authorize("ADMIN", "AGENT"), validate({ body: createSchema }), saleController.create);
router.post("/:id/cancel", authorize("ADMIN", "AGENT"), saleController.cancel);

export default router;
