import { Router } from "express";

import {
  create,
  update,
  remove,
  reorder,
} from "../controllers/workflow-step.controller";

import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/workflows/:workflowId/steps", create);

router.put("/workflows/:workflowId/steps/reorder", reorder);

router.put("/workflow-steps/:stepId", update);

router.delete("/workflow-steps/:stepId", remove);

export default router;