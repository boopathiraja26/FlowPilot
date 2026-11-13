import { Router } from "express";

import {
  getDashboardSummary,
  getSummary,
} from "../controllers/analytics.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);
router.get("/dashboard-summary", getDashboardSummary);
router.get("/", getSummary);

export default router;
