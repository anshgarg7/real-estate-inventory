import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import * as authController from "../controllers/auth.controller";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", validate({ body: loginSchema }), authController.login);
router.get("/me", authenticate, authController.me);

export default router;
