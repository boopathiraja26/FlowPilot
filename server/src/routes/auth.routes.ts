import { Router } from "express";

import {
  changePassword,
  getProfile,
  login,
  logout,
  register,
  updateProfile,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";


const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, getProfile);
router.patch("/me", requireAuth, updateProfile);
router.post("/password", requireAuth, changePassword);

export default router;