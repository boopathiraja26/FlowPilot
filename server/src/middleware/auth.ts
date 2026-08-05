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
}

function isAccessTokenPayload(payload: unknown): payload is AccessTokenPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as AccessTokenPayload).sub === "string"
  );
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
      },
    });

    if (!user) {
      throw new ApiError(401, "User no longer exists");
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
}