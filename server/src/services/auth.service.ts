import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { PrismaClient, User } from "@prisma/client";

import { env } from "../config/env";
import { ApiError } from "../middleware/errorHandler";
import { RegisterInput, LoginInput } from "../validators/auth.validation";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

// =========================================================
// Types
// =========================================================

export type SafeUser = Omit<User, "password">;

export interface AuthResult {
  user: SafeUser;
  accessToken: string;
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

  console.log("Email from request:", email);
console.log("Password from request:", password);
console.log("User found:", user.email);
console.log("Stored hash:", user.password);

const isPasswordValid = await bcrypt.compare(password, user.password);

console.log("Password valid:", isPasswordValid);

if (!isPasswordValid) {
  throw new ApiError(401, "Invalid email or password");
}

  const accessToken = generateAccessToken(user);

  return {
    user: sanitizeUser(user),
    accessToken,
  };
}