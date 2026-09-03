import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as dashboardController from "../controllers/dashboard.controller";

const router = Router();

router.use(authenticate);
router.get("/summary", dashboardController.summary);

export default router;
