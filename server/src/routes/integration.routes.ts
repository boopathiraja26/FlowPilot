import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import {
  disconnect,
  findAll,
  save,
} from "../controllers/integration.controller";

const router = Router();

router.use(requireAuth);

router.get("/", findAll);
router.put("/:provider", save);
router.delete("/:provider", disconnect);

export default router;
