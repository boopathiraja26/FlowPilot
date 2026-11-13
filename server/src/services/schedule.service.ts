import { ExecutionStatus, Prisma, WorkflowStatus } from "@prisma/client";

import prisma from "../lib/prisma";
import { ApiError } from "../middleware/errorHandler";
import {
  EXECUTION_JOB_NAME,
  getExecutionJobOptions,
  getExecutionQueue,
} from "../queue/executionQueue";
import { markExecutionFailed } from "./execution.service";
import {
  CreateScheduleInput,
  getNextScheduleRun,
} from "../validators/schedule.validation";

function getTriggerInput(value: Prisma.JsonValue): Prisma.InputJsonValue {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ApiError(500, "Scheduled trigger data is invalid.");
  }
  return value as Prisma.InputJsonObject;
}

export function buildScheduleOwnerFilter(
  userId: string,
  scheduleId?: string
): Prisma.WorkflowScheduleWhereInput {
  return {
    ...(scheduleId ? { id: scheduleId } : {}),
    workflow: { userId },
  };
}

const scheduleSummarySelect = {
  id: true,
  workflowId: true,
  firstRunAt: true,
  nextRunAt: true,
  intervalMinutes: true,
  isActive: true,
  createdAt: true,
  workflow: {
    select: {
      id: true,
      title: true,
      status: true,
    },
  },
} as const;

export async function listWorkflowSchedules(userId: string) {
  return prisma.workflowSchedule.findMany({
    where: buildScheduleOwnerFilter(userId),
    select: scheduleSummarySelect,
    orderBy: [
      { nextRunAt: { sort: "asc", nulls: "last" } },
      { createdAt: "desc" },
    ],
  });
}

export async function createWorkflowSchedule(
  userId: string,
  input: CreateScheduleInput
) {
  const firstRunAt = new Date(input.firstRunAt);
  if (firstRunAt.getTime() <= Date.now()) {
    throw new ApiError(400, "The first run time must be in the future.");
  }

  const workflow = await prisma.workflow.findFirst({
    where: {
      id: input.workflowId,
      userId,
      status: WorkflowStatus.ACTIVE,
    },
    select: { id: true },
  });
  if (!workflow) {
    throw new ApiError(404, "Active workflow not found.");
  }

  return prisma.workflowSchedule.create({
    data: {
      workflowId: workflow.id,
      firstRunAt,
      nextRunAt: firstRunAt,
      intervalMinutes: input.intervalMinutes ?? null,
      triggerInput: input.triggerInput as Prisma.InputJsonValue,
    },
    select: scheduleSummarySelect,
  });
}

export async function setWorkflowScheduleActive(
  userId: string,
  scheduleId: string,
  isActive: boolean
) {
  const schedule = await prisma.workflowSchedule.findFirst({
    where: {
      ...buildScheduleOwnerFilter(userId, scheduleId),
    },
    select: {
      nextRunAt: true,
      intervalMinutes: true,
    },
  });
  if (!schedule) {
    throw new ApiError(404, "Schedule not found.");
  }
  if (isActive && schedule.nextRunAt === null) {
    throw new ApiError(400, "A completed one-time schedule cannot be resumed.");
  }

  return prisma.workflowSchedule.update({
    where: { id: scheduleId },
    data: { isActive },
    select: scheduleSummarySelect,
  });
}

export async function deleteWorkflowSchedule(
  userId: string,
  scheduleId: string
): Promise<void> {
  const result = await prisma.workflowSchedule.deleteMany({
    where: {
      ...buildScheduleOwnerFilter(userId, scheduleId),
    },
  });
  if (result.count === 0) {
    throw new ApiError(404, "Schedule not found.");
  }
}

export async function dispatchDueWorkflowSchedules(
  now: Date = new Date()
): Promise<number> {
  const dueSchedules = await prisma.workflowSchedule.findMany({
    where: {
      isActive: true,
      nextRunAt: { lte: now },
      workflow: { status: WorkflowStatus.ACTIVE },
    },
    select: { id: true, nextRunAt: true },
    orderBy: { nextRunAt: "asc" },
    take: 100,
  });
  let dispatched = 0;

  for (const dueSchedule of dueSchedules) {
    if (!dueSchedule.nextRunAt) continue;

    const execution = await prisma.$transaction(async (transaction) => {
      const current = await transaction.workflowSchedule.findUnique({
        where: { id: dueSchedule.id },
        include: {
          workflow: {
            select: { userId: true, status: true },
          },
        },
      });

      if (
        !current ||
        !current.isActive ||
        !current.nextRunAt ||
        current.nextRunAt.getTime() !== dueSchedule.nextRunAt!.getTime() ||
        current.workflow.status !== WorkflowStatus.ACTIVE
      ) {
        return null;
      }

      const nextRunAt = getNextScheduleRun(now, current.intervalMinutes);
      const claimed = await transaction.workflowSchedule.updateMany({
        where: {
          id: current.id,
          isActive: true,
          nextRunAt: current.nextRunAt,
        },
        data: {
          isActive: nextRunAt !== null,
          nextRunAt,
        },
      });
      if (claimed.count !== 1) return null;

      return transaction.workflowExecution.create({
        data: {
          workflowId: current.workflowId,
          status: ExecutionStatus.QUEUED,
          triggerInput: getTriggerInput(current.triggerInput),
        },
        select: { id: true },
      });
    });

    if (!execution) continue;

    try {
      await getExecutionQueue().add(
        EXECUTION_JOB_NAME,
        { executionId: execution.id },
        getExecutionJobOptions(execution.id)
      );
      dispatched += 1;
    } catch {
      await markExecutionFailed(
        execution.id,
        "Scheduled execution could not be queued. Check worker availability before the next scheduled run."
      ).catch(() => {
        console.error("[scheduler] Could not persist a failed scheduled execution.");
      });
      console.error("[scheduler] A due schedule could not be queued.");
    }
  }

  return dispatched;
}
