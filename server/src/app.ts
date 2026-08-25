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

// Trust the first proxy hop (Render's load balancer).
// Required so express-rate-limit can safely read X-Forwarded-For
// without throwing ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set("trust proxy", 1);

// Security headers-
app.use(helmet());

// CORS
app.use(cors(corsOptions));

// Request logging
app.use(morgan(env.isProduction ? "combined" : "dev"));

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
