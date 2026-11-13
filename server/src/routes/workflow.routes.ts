import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import { create, duplicate, findAll, findOne, remove, update } from "../controllers/workflow.controller";

const router = Router();

router.use(requireAuth);

router.post("/", create);
router.post("/:id/duplicate", duplicate);
router.get("/", findAll);
router.get("/:id", findOne);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;