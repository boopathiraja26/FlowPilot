import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { ApiError } from "./errorHandler";
import { jwtConfig } from "../config/jwt";
import prisma from "../lib/prisma";

// =========================================================
// Types
// =========================================================

interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  passwordVersion?: number;
}

function isAccessTokenPayload(payload: unknown): payload is AccessTokenPayload {
  if (typeof payload !== "object" || payload === null) return false;
  const tokenPayload = payload as {
    sub?: unknown;
    passwordVersion?: unknown;
  };
  return (
    typeof tokenPayload.sub === "string" &&
    (tokenPayload.passwordVersion === undefined ||
      (typeof tokenPayload.passwordVersion === "number" &&
        Number.isInteger(tokenPayload.passwordVersion) &&
        tokenPayload.passwordVersion >= 0))
  );
}

export function isPasswordVersionCurrent(
  tokenVersion: number | undefined,
  userVersion: number
): boolean {
  return (tokenVersion ?? 0) === userVersion;
}

// =========================================================
// Helpers
// =========================================================

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (token) {
      return token;
    }
  }

  const cookieToken = req.cookies?.[jwtConfig.cookieNames.accessToken];
  if (typeof cookieToken === "string" && cookieToken) {
    return cookieToken;
  }

  return null;
}

// =========================================================
// requireAuth
// =========================================================

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new ApiError(401, "Authentication required");
    }

    let decoded: unknown;

    try {
      decoded = jwt.verify(token, env.jwt.secret);
    } catch {
      throw new ApiError(401, "Invalid or expired token");
    }

    if (!isAccessTokenPayload(decoded)) {
      throw new ApiError(401, "Invalid token payload");
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        name: true,
        email: true,
        passwordVersion: true,
      },
    });

    if (!user) {
      throw new ApiError(401, "User no longer exists");
    }

    if (!isPasswordVersionCurrent(decoded.passwordVersion, user.passwordVersion)) {
      throw new ApiError(401, "Invalid or expired token");
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
}