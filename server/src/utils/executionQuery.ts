import { ExecutionStatus, Prisma } from "@prisma/client";
import { z } from "zod";

const executionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(ExecutionStatus).optional(),
  workflowId: z.string().uuid().optional(),
}).strict();

export type ExecutionListQuery = z.infer<typeof executionListQuerySchema>;

export function parseExecutionListQuery(query: unknown) {
  return executionListQuerySchema.safeParse(query);
}

export function buildExecutionWhere(
  userId: string,
  query: Pick<ExecutionListQuery, "status" | "workflowId">
): Prisma.WorkflowExecutionWhereInput {
  return {
    ...(query.status ? { status: query.status } : {}),
    ...(query.workflowId ? { workflowId: query.workflowId } : {}),
    workflow: { userId },
  };
}

export function getExecutionOffset(query: Pick<ExecutionListQuery, "page" | "limit">) {
  return (query.page - 1) * query.limit;
}
