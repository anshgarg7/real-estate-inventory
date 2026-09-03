import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import * as installmentController from "../controllers/installment.controller";

const router = Router();

// Installment.amountDue is stored as @db.Decimal(14, 2) — 12 integer digits max.
const MAX_AMOUNT = 999_999_999_999.99;

const updateSchema = z.object({
  dueDate: z.coerce.date().optional(),
  amountDue: z.number().positive().max(MAX_AMOUNT).optional(),
});

const addSchema = z.object({
  amountDue: z.number().positive().max(MAX_AMOUNT),
  dueDate: z.coerce.date(),
});

router.use(authenticate);

router.get("/overdue", installmentController.listOverdue);
router.get("/sale/:saleId", installmentController.listForSale);
router.post(
  "/sale/:saleId",
  authorize("ADMIN", "ACCOUNTANT"),
  validate({ body: addSchema }),
  installmentController.add
);
router.get("/:id", installmentController.get);
router.patch(
  "/:id",
  authorize("ADMIN", "ACCOUNTANT"),
  validate({ body: updateSchema }),
  installmentController.update
);
router.delete("/:id", authorize("ADMIN", "ACCOUNTANT"), installmentController.remove);

export default router;
