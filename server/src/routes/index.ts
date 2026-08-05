import { Router } from "express";

import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import workflowRoutes from "./workflow.routes";
import aiRoutes from "./ai.routes";
import executionRoutes from "./execution.routes";
import workflowStepRoutes from "./workflow-step.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/workflows", workflowRoutes);
router.use("/ai", aiRoutes);
router.use("/executions", executionRoutes);
router.use("/", workflowStepRoutes);

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the FlowPilot API",
    version: "1.0.0",
    endpoints: [
      "/api/health",
      "/api/auth",
      "/api/workflows",
      "/api/ai",
    ],
  });
});

export default router;