import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { Prisma, User } from "@prisma/client";

import { env } from "../config/env";
import { ApiError } from "../middleware/errorHandler";
import {
  ChangePasswordInput,
  LoginInput,
  ProfileUpdateInput,
  RegisterInput,
} from "../validators/auth.validation";
import prisma from "../lib/prisma";

const SALT_ROUNDS = 12;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function buildUserIdFilter(userId: string): Prisma.UserWhereUniqueInput {
  return { id: userId };
}

export function buildProfileUpdateData(
  input: ProfileUpdateInput
): Prisma.UserUpdateInput {
  return { name: input.name, email: input.email };
}

export function toUserProfile(user: UserProfile): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// =========================================================
// Types
// =========================================================

export type SafeUser = Omit<User, "password" | "passwordVersion">;

export interface AuthResult {
  user: SafeUser;
  accessToken: string;
}

export interface PasswordChangeResult {
  accessToken: string;
}

// =========================================================
// Helpers
// =========================================================

function sanitizeUser(user: User): SafeUser {
  const {
    password: _password,
    passwordVersion: _passwordVersion,
    ...safeUser
  } = user;
  return safeUser;
}

export function generateAccessToken(
  user: Pick<User, "id" | "email" | "role" | "passwordVersion">
): string {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    passwordVersion: user.passwordVersion,
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

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({
    where: buildUserIdFilter(userId),
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return toUserProfile(user);
}

export async function updateUserProfile(
  userId: string,
  input: ProfileUpdateInput
): Promise<UserProfile> {
  try {
    return await prisma.user.update({
      where: buildUserIdFilter(userId),
      data: buildProfileUpdateData(input),
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    }).then(toUserProfile);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError(409, "An account with this email already exists");
    }

    throw error;
  }
}

export async function verifyCurrentPassword(
  currentPassword: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(currentPassword, passwordHash);
}

export async function assertCurrentPassword(
  currentPassword: string,
  passwordHash: string
): Promise<void> {
  if (!(await verifyCurrentPassword(currentPassword, passwordHash))) {
    throw new ApiError(400, "Current password is incorrect.");
  }
}

export async function changeUserPassword(
  userId: string,
  input: ChangePasswordInput
): Promise<PasswordChangeResult> {
  const user = await prisma.user.findUnique({
    where: buildUserIdFilter(userId),
    select: { password: true, passwordVersion: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.password) {
    throw new ApiError(400, "Password change is unavailable for this account.");
  }

  await assertCurrentPassword(input.currentPassword, user.password);

  if (input.currentPassword === input.newPassword) {
    throw new ApiError(400, "New password must differ from the current password.");
  }

  const hashedPassword = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
  const updatedUser = await prisma.user.update({
    where: buildUserIdFilter(userId),
    data: {
      password: hashedPassword,
      passwordVersion: { increment: 1 },
    },
    select: { id: true, email: true, role: true, passwordVersion: true },
  });

  return { accessToken: generateAccessToken(updatedUser) };
}