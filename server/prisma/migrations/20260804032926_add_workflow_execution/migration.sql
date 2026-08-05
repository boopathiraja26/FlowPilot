-- CreateEnum
CREATE TYPE "public"."ExecutionStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."workflow_executions" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "status" "public"."ExecutionStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."execution_logs" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "stepType" "public"."WorkflowStepType" NOT NULL,
    "status" "public"."ExecutionStatus" NOT NULL,
    "message" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workflow_executions_workflowId_idx" ON "public"."workflow_executions"("workflowId");

-- CreateIndex
CREATE INDEX "execution_logs_executionId_idx" ON "public"."execution_logs"("executionId");

-- AddForeignKey
ALTER TABLE "public"."workflow_executions" ADD CONSTRAINT "workflow_executions_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "public"."workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."execution_logs" ADD CONSTRAINT "execution_logs_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "public"."workflow_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
