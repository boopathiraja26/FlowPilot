import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (value === undefined) {
    console.warn(`[config] Missing environment variable: ${name}`);
    return "";
  }

  return value;
}

export const env = {
  nodeEnv: required("NODE_ENV", "development"),

  port: parseInt(required("PORT", "5000"), 10),

  clientOrigin: required(
    "CLIENT_ORIGIN",
    "http://localhost:3000"
  ),

  jwt: {
    secret: required(
      "JWT_SECRET",
      "dev_secret_change_me"
    ),

    expiresIn: required(
      "JWT_EXPIRES_IN",
      "7d"
    ),

    refreshSecret: required(
      "JWT_REFRESH_SECRET",
      "dev_refresh_secret_change_me"
    ),

    refreshExpiresIn: required(
      "JWT_REFRESH_EXPIRES_IN",
      "30d"
    ),
  },

  gemini: {
    apiKey: required("GEMINI_API_KEY"),
    model: required("GEMINI_MODEL", "gemini-2.5-flash"),
  },

  rateLimit: {
    windowMs: parseInt(
      required("RATE_LIMIT_WINDOW_MS", "900000"),
      10
    ),

    maxRequests: parseInt(
      required("RATE_LIMIT_MAX_REQUESTS", "100"),
      10
    ),
  },

  cookieSecret: required(
    "COOKIE_SECRET",
    "dev_cookie_secret_change_me"
  ),
  
  email: {
  host: required("SMTP_HOST"),
  port: parseInt(required("SMTP_PORT", "587"), 10),
  user: required("SMTP_USER"),
  pass: required("SMTP_PASS"),
  from: required("SMTP_FROM"),
},

  isProduction:
    process.env.NODE_ENV === "production",
};
