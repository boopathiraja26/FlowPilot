import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import {
  create,
  findAll,
  remove,
  update,
} from "../controllers/schedule.controller";

const router = Router();

router.use(requireAuth);
router.get("/", findAll);
router.post("/", create);
router.patch("/:id", update);
router.delete("/:id", remove);

export default router;
