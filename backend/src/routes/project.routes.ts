import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import * as projectController from "../controllers/project.controller";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  description: z.string().optional(),
});

const updateSchema = createSchema.partial();

router.use(authenticate);

router.get("/", projectController.list);
router.get("/:id", projectController.get);
router.post("/", authorize("ADMIN"), validate({ body: createSchema }), projectController.create);
router.patch("/:id", authorize("ADMIN"), validate({ body: updateSchema }), projectController.update);
router.delete("/:id", authorize("ADMIN"), projectController.remove);

export default router;
