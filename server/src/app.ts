import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { env } from "./config/env";
import { corsOptions } from "./config/cors";
import apiRouter from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";

const app: Application = express();

const SENSITIVE_QUERY_KEYS = new Set(["secret", "token", "webhooksecret"]);

function sanitizeRequestUrl(rawUrl: string): string {
  const url = rawUrl || "/";
  const queryIndex = url.indexOf("?");
  if (queryIndex === -1) {
    return url;
  }

  const path = url.slice(0, queryIndex);
  const search = url.slice(queryIndex + 1);
  const params = new URLSearchParams(search);

  for (const [key] of Array.from(params.entries())) {
    if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
      params.set(key, "[REDACTED]");
    }
  }

  const sanitized = params.toString();
  return sanitized ? `${path}?${sanitized}` : path;
}

morgan.token("sanitized-url", (req) => {
  const original = (req as { originalUrl?: string; url?: string }).originalUrl || req.url || "/";
  return sanitizeRequestUrl(original);
});

// Trust the first proxy hop (Render's load balancer).
// Required so express-rate-limit can safely read X-Forwarded-For
// without throwing ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set("trust proxy", 1);

// Security headers-
app.use(helmet());

// CORS
app.use(cors(corsOptions));

// Request logging (sanitize sensitive query params in logged URLs)
const morganFormat = env.isProduction
  ? ':remote-addr - :remote-user [:date[clf]] ":method :sanitized-url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'
  : ":method :sanitized-url :status :response-time ms - :res[content-length]";
app.use(morgan(morganFormat));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieParser(env.cookieSecret));

// Rate limiting on all /api routes
if (env.isProduction) {
  app.use("/api", apiLimiter);
}

// Routes
app.use("/api", apiRouter);

// 404 + centralized error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
