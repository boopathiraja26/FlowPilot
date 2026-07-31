import { env } from "./env";

/**
 * JWT configuration structure.
 * NOTE: Authentication logic (signing/verifying/issuing tokens) is
 * intentionally NOT implemented in this phase. This file only reserves
 * the shape/config so auth can be wired in later without restructuring.
 */
export const jwtConfig = {
  accessToken: {
    secret: env.jwt.secret,
    expiresIn: env.jwt.expiresIn,
  },
  refreshToken: {
    secret: env.jwt.refreshSecret,
    expiresIn: env.jwt.refreshExpiresIn,
  },
  cookieNames: {
    accessToken: "flowpilot_access_token",
    refreshToken: "flowpilot_refresh_token",
  },
};
