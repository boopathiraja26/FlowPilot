import { Router } from "express";

import {
  execute,
  enqueue,
  findAll,
  findOne,
} from "../controllers/execution.controller";

import { requireAuth } from "../middleware/auth";

const router = Router();

// All execution routes require authentication
router.use(requireAuth);

// Execute a workflow
router.post("/:workflowId", execute);

// Queue an execution for the separate background worker
router.post("/:workflowId/queue", enqueue);

// List all executions
router.get("/", findAll);

// Get execution details
router.get("/:id", findOne);

export default router;