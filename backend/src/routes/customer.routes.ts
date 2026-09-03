import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import * as customerController from "../controllers/customer.controller";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  cnic: z.string().optional(),
  address: z.string().optional(),
});

const updateSchema = createSchema.partial();

router.use(authenticate);

router.get("/", customerController.list);
router.get("/:id", customerController.get);
router.post("/", authorize("ADMIN", "AGENT"), validate({ body: createSchema }), customerController.create);
router.patch("/:id", authorize("ADMIN", "AGENT"), validate({ body: updateSchema }), customerController.update);
router.delete("/:id", authorize("ADMIN", "AGENT"), customerController.remove);

export default router;
