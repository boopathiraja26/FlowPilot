ALTER TYPE "public"."ExecutionStatus" ADD VALUE 'QUEUED';

ALTER TABLE "public"."workflow_executions"
    ALTER COLUMN "startedAt" DROP NOT NULL,
    ALTER COLUMN "startedAt" DROP DEFAULT,
    ADD COLUMN "triggerInput" JSONB,
    ADD COLUMN "failureReason" TEXT;
