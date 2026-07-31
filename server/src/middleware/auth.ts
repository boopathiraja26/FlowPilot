import { NextFunction, Request, Response } from "express";
import { ApiError } from "./errorHandler";

/**
 * Auth middleware STRUCTURE ONLY.
 * Token verification / JWT decoding is intentionally not implemented
 * in this phase. This placeholder documents the intended contract:
 *  - Read token from Authorization header or httpOnly cookie
 *  - Verify it against jwtConfig
 *  - Attach the decoded user payload to req.user
 *  - Call next() or forward an ApiError(401, ...)
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  // TODO (future phase): implement real token verification
  const hasToken = Boolean(req.headers.authorization) || Boolean(req.cookies?.flowpilot_access_token);

  if (!hasToken) {
    return next(new ApiError(401, "Authentication required"));
  }

  next();
}
