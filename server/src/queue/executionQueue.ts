import { JobsOptions, Queue, QueueOptions } from "bullmq";

import { env } from "../config/env";

export const EXECUTION_QUEUE_NAME = "workflow-executions";
export const EXECUTION_JOB_NAME = "execute-workflow";

export interface ExecutionJobData {
  executionId: string;
}

export const executionWorkerOptions = {
  concurrency: 2,
  maxStalledCount: 0,
} as const;

export function getRedisConnectionOptions(
  redisUrl: string = env.redisUrl
): NonNullable<QueueOptions["connection"]> {
  const parsed = new URL(redisUrl);
  if (parsed.protocol !== "redis:" && parsed.protocol !== "rediss:") {
    throw new Error("REDIS_URL must use redis:// or rediss://.");
  }

  const database = parsed.pathname.replace(/^\//, "");
  const db = database ? Number(database) : 0;
  if (!Number.isSafeInteger(db) || db < 0) {
    throw new Error("REDIS_URL must contain a valid database number.");
  }

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    db,
    ...(parsed.protocol === "rediss:" ? { tls: {} } : {}),
    maxRetriesPerRequest: null,
  };
}

export function getExecutionJobOptions(executionId: string): JobsOptions {
  return {
    jobId: executionId,
    attempts: 1,
    removeOnComplete: true,
    removeOnFail: false,
  };
}

let executionQueue: Queue<ExecutionJobData> | undefined;

export function getExecutionQueue(): Queue<ExecutionJobData> {
  if (!executionQueue) {
    executionQueue = new Queue<ExecutionJobData>(EXECUTION_QUEUE_NAME, {
      connection: getRedisConnectionOptions(),
    });
  }

  return executionQueue;
}
