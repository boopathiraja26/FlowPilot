import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import {
  activate,
  create,
  deactivate,
  duplicate,
  findAll,
  findOne,
  remove,
  update,
} from "../controllers/workflow.controller";

const router = Router();

router.use(requireAuth);

router.post("/", create);
router.get("/", findAll);
router.get("/:id", findOne);
router.put("/:id", update);
router.post("/:id/activate", activate);
router.post("/:id/deactivate", deactivate);
router.post("/:id/duplicate", duplicate);
router.delete("/:id", remove);

export default router;