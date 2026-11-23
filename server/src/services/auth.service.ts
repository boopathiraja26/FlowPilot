import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { User } from "@prisma/client";

import { env } from "../config/env";
import { ApiError } from "../middleware/errorHandler";
import { ChangePasswordInput, LoginInput, RegisterInput, UpdateProfileInput } from "../validators/auth.validation";
import prisma from "../lib/prisma";

const SALT_ROUNDS = 12;

// =========================================================
// Types
// =========================================================

export type SafeUser = Omit<User, "password">;

export interface AuthResult {
  user: SafeUser;
  accessToken: string;
}

export interface AccountSettingsSummary {
  profile: SafeUser & { hasPassword: boolean };
  security: {
    hasPassword: boolean;
    canChangePassword: boolean;
    signInMethods: string[];
    email: string;
    updatedAt: Date;
  };
  integrations: {
    ai: { configured: boolean; model: string | null };
    email: { configured: boolean; host: string | null; from: string | null };
  };
  preferences: {
    theme: { mode: "system" | "light" | "dark"; persisted: "local"; serverBacked: false };
  };
  notes: string[];
}

// =========================================================
// Helpers
// =========================================================

function sanitizeUser(user: User): SafeUser {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

function generateAccessToken(user: Pick<User, "id" | "email" | "role">): string {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  } as SignOptions);
}

// =========================================================
// registerUser
// =========================================================

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const { name, email, password } = input;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  const accessToken = generateAccessToken(user);

  return {
    user: sanitizeUser(user),
    accessToken,
  };
}

// =========================================================
// loginUser
// =========================================================

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.password) {
    throw new ApiError(
      400,
      "This account uses Google Sign-In. Please log in with Google instead."
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const accessToken = generateAccessToken(user);

  return {
    user: sanitizeUser(user),
    accessToken,
  };
}

// =========================================================
// Profile
// =========================================================

export async function getAccountSettingsSummary(userId: string): Promise<AccountSettingsSummary> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const hasPassword = Boolean(user.password && user.password.length > 0);
  const signInMethods = hasPassword ? ["Email and password"] : ["Google Sign-In (or external provider)"];
  const aiConfigured = Boolean(env.gemini.apiKey && env.gemini.apiKey.trim());
  const emailConfigured = Boolean(env.email.host && env.email.user && env.email.pass && env.email.from);

  return {
    profile: {
      ...sanitizeUser(user),
      hasPassword,
    },
    security: {
      hasPassword,
      canChangePassword: hasPassword,
      signInMethods,
      email: user.email,
      updatedAt: user.updatedAt,
    },
    integrations: {
      ai: {
        configured: aiConfigured,
        model: aiConfigured ? env.gemini.model || null : null,
      },
      email: {
        configured: emailConfigured,
        host: emailConfigured ? env.email.host : null,
        from: emailConfigured ? env.email.from : null,
      },
    },
    preferences: {
      theme: {
        mode: "system",
        persisted: "local",
        serverBacked: false,
      },
    },
    notes: [
      "Integration credentials are managed through server environment configuration and are not editable in this UI.",
      ...(hasPassword ? [] : ["Password change is unavailable for accounts without a local password."]),
    ],
  };
}

export async function updateUserProfile(userId: string, input: UpdateProfileInput): Promise<SafeUser> {
  const data: { name?: string; avatar?: string | null } = {};

  if (input.name !== undefined) {
    data.name = input.name.trim();
  }

  if (input.avatar !== undefined) {
    if (input.avatar === null || input.avatar === "") {
      data.avatar = null;
    } else {
      data.avatar = input.avatar.trim();
    }
  }

  if (Object.keys(data).length === 0) {
    throw new ApiError(400, "No profile changes were provided");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return sanitizeUser(user);
}

export async function changeUserPassword(userId: string, input: ChangePasswordInput): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.password) {
    throw new ApiError(400, "Password change is not available for this account. Use your linked sign-in provider.");
  }

  const isCurrentPasswordValid = await bcrypt.compare(input.currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new ApiError(400, "Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}