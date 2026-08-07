import { Request, Response } from "express";

import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../middleware/errorHandler";
import { registerSchema, loginSchema } from "../validators/auth.validation";
import { registerUser, loginUser } from "../services/auth.service";
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