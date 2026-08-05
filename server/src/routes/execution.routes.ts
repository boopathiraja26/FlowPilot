import { Router } from "express";

import {
  execute,
 findAll,
  findOne,
} from "../controllers/execution.controller";

import { requireAuth } from "../middleware/auth";

const router = Router();

// All execution routes require authentication
router.use(requireAuth);

// Execute a workflow
router.post("/:workflowId", execute);

// List all executions
router.get("/", findAll);

// Get execution details
router.get("/:id", findOne);

export default router;