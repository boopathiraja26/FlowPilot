import { QueueEvents, Worker } from "bullmq";
import { ExecutionStatus } from "@prisma/client";

import prisma from "../lib/prisma";
import {
  EXECUTION_JOB_NAME,
  EXECUTION_QUEUE_NAME,
  ExecutionJobData,
  executionWorkerOptions,
  getExecutionJobOptions,
  getExecutionQueue,
  getRedisConnectionOptions,
} from "../queue/executionQueue";
import {
  markExecutionFailed,
  processQueuedExecution,
} from "../services/execution.service";
import { dispatchDueWorkflowSchedules } from "../services/schedule.service";

export async function recoverQueuedExecutions(): Promise<void> {
  const queue = getExecutionQueue();
  const queuedExecutions = await prisma.workflowExecution.findMany({
    where: { status: ExecutionStatus.QUEUED },
    select: { id: true, triggerInput: true },
    orderBy: { createdAt: "asc" },
  });

  for (const execution of queuedExecutions) {
    if (execution.triggerInput === null) {
      await markExecutionFailed(
        execution.id,
        "Queued trigger data is unavailable. Start a new execution after checking workflow state."
      );
      continue;
    }

    const job = await queue.add(
      EXECUTION_JOB_NAME,
      { executionId: execution.id },
      getExecutionJobOptions(execution.id)
    );

    if ((await job.getState()) === "failed") {
      await markExecutionFailed(
        execution.id,
        "The worker stopped unexpectedly. External effects may have occurred; automatic retry was disabled."
      );
    }
  }
}

export async function startExecutionWorker() {
  const queue = getExecutionQueue();
  const queueEvents = new QueueEvents(EXECUTION_QUEUE_NAME, {
    connection: getRedisConnectionOptions(),
  });
  queueEvents.on("error", () => {
    console.error("[worker] Execution queue event connection error.");
  });
  await queueEvents.waitUntilReady();

  queueEvents.on("failed", ({ jobId }) => {
    if (!jobId) return;
    void markExecutionFailed(
      jobId,
      "The worker stopped unexpectedly. External effects may have occurred; automatic retry was disabled."
    ).catch(() => {
      console.error("[worker] Could not persist a failed execution status.");
    });
  });

  const worker = new Worker<ExecutionJobData>(
    EXECUTION_QUEUE_NAME,
    async (job) => {
      if (job.name !== EXECUTION_JOB_NAME) {
        throw new Error("Unsupported execution job.");
      }
      await processQueuedExecution(job.data.executionId);
    },
    {
      connection: getRedisConnectionOptions(),
      ...executionWorkerOptions,
    }
  );

  worker.on("error", () => {
    console.error("[worker] Background worker connection or processing error.");
  });

  await worker.waitUntilReady();
  await recoverQueuedExecutions();
  await dispatchDueWorkflowSchedules();
  const scheduleTimer = setInterval(() => {
    void dispatchDueWorkflowSchedules().catch(() => {
      console.error("[scheduler] Schedule polling failed.");
    });
  }, 15_000);
  console.log("[worker] Execution worker is ready.");

  return {
    async close() {
      clearInterval(scheduleTimer);
      await worker.close();
      await queueEvents.close();
      await queue.close();
      await prisma.$disconnect();
    },
  };
}
