import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);

// Base API info route: GET /api
router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the FlowPilot API",
    version: "1.0.0",
    endpoints: ["/api/health", "/api/auth"],
  });
});

export default router;
