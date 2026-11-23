import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// 404 handler - place after all routes
export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// Centralized error handler - place last, after notFoundHandler
export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const isClientError = statusCode >= 400 && statusCode < 500;
  const rawMessage = err.message || "Internal Server Error";
  const isUnexpectedServerError = statusCode >= 500 && !(err instanceof ApiError);

  // Preserve safe messages; avoid exposing internal/database details from unexpected server errors in production responses.
  const message =
    env.isProduction && isUnexpectedServerError ? "Internal Server Error" : rawMessage;

  // Expected 4xx errors: concise logging without stack-trace noise.
  // 5xx/unexpected errors: preserve useful diagnostics in development; avoid exposing stacks in production logs.
  if (isClientError) {
    // eslint-disable-next-line no-console
    console.warn(`[http] ${statusCode} ${req.method} ${req.originalUrl} - ${rawMessage}`);
  } else if (!env.isProduction) {
    // eslint-disable-next-line no-console
    console.error(`[http] ${statusCode} ${req.method} ${req.originalUrl}`, err);
  } else {
    // eslint-disable-next-line no-console
    console.error(`[http] ${statusCode} ${req.method} ${req.originalUrl} - ${rawMessage}`);
  }

  const responseBody: Record<string, unknown> = {
    success: false,
    message,
  };

  if (err instanceof ApiError && err.details !== undefined) {
    responseBody.details = err.details;
  }

  // Never expose stack traces/internal error stacks in API responses (dev or prod).
  res.status(statusCode).json(responseBody);
}
