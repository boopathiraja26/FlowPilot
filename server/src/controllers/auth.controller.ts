import { Request, Response } from "express";

import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../middleware/errorHandler";
import { changePasswordSchema, loginSchema, registerSchema, updateProfileSchema } from "../validators/auth.validation";
import {
  changeUserPassword,
  getAccountSettingsSummary,
  loginUser,
  registerUser,
  updateUserProfile,
} from "../services/auth.service";
import { jwtConfig } from "../config/jwt";
import { env } from "../config/env";

// =========================================================
// Helpers
// =========================================================

function setAccessTokenCookie(
  res: Response,
  accessToken: string
): void {
  res.cookie(jwtConfig.cookieNames.accessToken, accessToken, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function getUserId(req: Request): string {
  const userId = (req.user as { id?: string } | undefined)?.id;
  if (!userId) {
    throw new ApiError(401, "Authentication required");
  }
  return userId;
}

// =========================================================
// POST /api/auth/register
// =========================================================

export const register = asyncHandler(async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(
      400,
      "Validation failed",
      parsed.error.flatten().fieldErrors
    );
  }

  const { user, accessToken } = await registerUser(parsed.data);

  setAccessTokenCookie(res, accessToken);

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: {
      user,
      accessToken,
    },
  });
});

// =========================================================
// POST /api/auth/login
// =========================================================

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(
      400,
      "Validation failed",
      parsed.error.flatten().fieldErrors
    );
  }

  const { user, accessToken } = await loginUser(parsed.data);

  setAccessTokenCookie(res, accessToken);

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    data: {
      user,
      accessToken,
    },
  });
});

// =========================================================
// POST /api/auth/logout
// =========================================================

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(jwtConfig.cookieNames.accessToken, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
    path: "/",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// =========================================================
// GET /api/auth/me
// =========================================================

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  res.status(200).json({
    success: true,
    message: "Session retrieved successfully",
    data: {
      user: req.user,
    },
  });
});

// =========================================================
// GET /api/auth/settings
// =========================================================

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const settings = await getAccountSettingsSummary(userId);

  res.status(200).json({
    success: true,
    message: "Account settings retrieved successfully",
    data: settings,
  });
});

// =========================================================
// PATCH /api/auth/profile
// =========================================================

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const parsed = updateProfileSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", parsed.error.flatten().fieldErrors);
  }

  const user = await updateUserProfile(userId, parsed.data);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: { user },
  });
});

// =========================================================
// POST /api/auth/change-password
// =========================================================

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const parsed = changePasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", parsed.error.flatten().fieldErrors);
  }

  await changeUserPassword(userId, parsed.data);

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});
