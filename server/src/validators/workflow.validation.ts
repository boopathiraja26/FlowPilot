import { z } from "zod";

// =========================================================
// Enums (mirrors Prisma WorkflowStatus)
// =========================================================

export const workflowStatusEnum = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);

// =========================================================
// Shared field rules
// =========================================================

const titleField = z
  .string({ required_error: "Title is required" })
  .trim()
  .min(3, "Title must be at least 3 characters long")
  .max(100, "Title must not exceed 100 characters");

const descriptionField = z
  .string()
  .trim()
  .max(500, "Description must not exceed 500 characters")
  .optional()
  .nullable();

const idParamField = z
  .string({ required_error: "Workflow id is required" })
  .uuid("Workflow id must be a valid UUID");

// =========================================================
// Create Workflow
// =========================================================

export const createWorkflowSchema = z.object({
  title: titleField,
  description: descriptionField,
  status: workflowStatusEnum.optional(),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;

// =========================================================
// Update Workflow
// =========================================================

export const updateWorkflowSchema = z
  .object({
    title: titleField.optional(),
    description: descriptionField,
    status: workflowStatusEnum.optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field must be provided to update" }
  );

export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;

// =========================================================
// Params
// =========================================================

export const workflowIdParamSchema = z.object({
  id: idParamField,
});

export type WorkflowIdParam = z.infer<typeof workflowIdParamSchema>;