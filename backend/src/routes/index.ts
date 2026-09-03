import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import projectRoutes from "./project.routes";
import plotRoutes from "./plot.routes";
import customerRoutes from "./customer.routes";
import saleRoutes from "./sale.routes";
import installmentRoutes from "./installment.routes";
import paymentRoutes from "./payment.routes";
import dashboardRoutes from "./dashboard.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/projects", projectRoutes);
router.use("/plots", plotRoutes);
router.use("/customers", customerRoutes);
router.use("/sales", saleRoutes);
router.use("/installments", installmentRoutes);
router.use("/payments", paymentRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
