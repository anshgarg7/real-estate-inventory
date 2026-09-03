import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import * as userController from "../controllers/user.controller";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(Role),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

router.use(authenticate, authorize("ADMIN"));

router.get("/", userController.list);
router.get("/:id", userController.get);
router.post("/", validate({ body: createSchema }), userController.create);
router.patch("/:id", validate({ body: updateSchema }), userController.update);

export default router;
