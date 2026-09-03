import { Router } from "express";
import { z } from "zod";
import { PaymentMethod } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import * as paymentController from "../controllers/payment.controller";

const router = Router();

const createSchema = z.object({
  installmentId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.nativeEnum(PaymentMethod),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.coerce.date().optional(),
});

const listQuerySchema = z.object({
  installmentId: z.string().uuid().optional(),
  saleId: z.string().uuid().optional(),
});

router.use(authenticate);

router.get("/", validate({ query: listQuerySchema }), paymentController.list);
router.post("/", authorize("ADMIN", "ACCOUNTANT"), validate({ body: createSchema }), paymentController.create);

export default router;
