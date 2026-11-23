import { Router } from "express";

import { changePassword, getSettings, login, logout, me, register, updateProfile } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.get("/settings", requireAuth, getSettings);
router.patch("/profile", requireAuth, updateProfile);
router.post("/change-password", requireAuth, changePassword);

export default router;
