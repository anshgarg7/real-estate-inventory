import { Router } from "express";
import { z } from "zod";
import { PlotStatus } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import * as plotController from "../controllers/plot.controller";

const router = Router();

const PLOT_FEATURES = ["Park Facing", "Corner Plot", "Both"] as const;

const createSchema = z.object({
  projectId: z.string().uuid(),
  plotNumber: z.string().min(1),
  block: z.enum(PLOT_FEATURES).optional(),
  sizeValue: z.number().positive(),
  sizeUnit: z.string().optional(),
  ratePerUnit: z.number().positive(),
  totalPrice: z.number().positive(),
});

const updateSchema = createSchema.partial().extend({
  status: z.nativeEnum(PlotStatus).optional(),
});

const listQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  status: z.nativeEnum(PlotStatus).optional(),
});

router.use(authenticate);

router.get("/", validate({ query: listQuerySchema }), plotController.list);
router.get("/:id", plotController.get);
router.post("/", authorize("ADMIN"), validate({ body: createSchema }), plotController.create);
router.patch("/:id", authorize("ADMIN"), validate({ body: updateSchema }), plotController.update);
router.delete("/:id", authorize("ADMIN"), plotController.remove);

export default router;
