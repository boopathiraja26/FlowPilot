import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import { generate, generateAndSave } from "../controllers/ai.controller";

const router = Router();

router.use(requireAuth);

router.post("/generate", generate);
router.post("/generate-and-save", generateAndSave);

export default router;