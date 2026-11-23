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

// =========================================================
// Profile update
// =========================================================

export const updateProfileSchema = z
  .object({
    name: nameField.optional(),
    avatar: z
      .union([
        z
          .string()
          .trim()
          .url("Avatar must be a valid URL")
          .max(500, "Avatar URL must not exceed 500 characters"),
        z.literal(""),
        z.null(),
      ])
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.avatar !== undefined, {
    message: "At least one profile field must be provided",
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// =========================================================
// Password change
// =========================================================

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: "Current password is required" })
      .min(1, "Current password is required"),
    newPassword: passwordField,
    confirmPassword: z
      .string({ required_error: "Confirm password is required" })
      .min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;