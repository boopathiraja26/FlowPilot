import { z } from "zod";

// =========================================================
// Shared field rules
// =========================================================

const nameField = z
  .string({ required_error: "Name is required" })
  .trim()
  .min(3, "Name must be at least 3 characters long")
  .max(50, "Name must not exceed 50 characters");

const emailField = z
  .string({ required_error: "Email is required" })
  .trim()
  .min(1, "Email is required")
  .email("Please provide a valid email address");

const passwordField = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const loginPasswordField = z
  .string({ required_error: "Password is required" })
  .min(1, "Password is required");

// =========================================================
// Register
// =========================================================

export const registerSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
});

export type RegisterInput = z.infer<typeof registerSchema>;

// =========================================================
// Login
// =========================================================

export const loginSchema = z.object({
  email: emailField,
  password: loginPasswordField,
});

export type LoginInput = z.infer<typeof loginSchema>;