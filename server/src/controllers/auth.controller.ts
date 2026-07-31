import { Request, Response } from "express";

/**
 * Auth controller STRUCTURE ONLY.
 * These handlers are placeholders for a future phase - no password
 * hashing, DB lookups, or token issuance is implemented here yet.
 */

export function register(_req: Request, res: Response): void {
  res.status(501).json({
    success: false,
    message: "Register endpoint not implemented yet",
  });
}

export function login(_req: Request, res: Response): void {
  res.status(501).json({
    success: false,
    message: "Login endpoint not implemented yet",
  });
}

export function logout(_req: Request, res: Response): void {
  res.status(501).json({
    success: false,
    message: "Logout endpoint not implemented yet",
  });
}

export function getCurrentUser(_req: Request, res: Response): void {
  res.status(501).json({
    success: false,
    message: "Current user endpoint not implemented yet",
  });
}
