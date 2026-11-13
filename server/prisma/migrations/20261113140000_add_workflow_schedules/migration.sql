CREATE TABLE "public"."workflow_schedules" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "firstRunAt" TIMESTAMP(3) NOT NULL,
    "nextRunAt" TIMESTAMP(3),
    "intervalMinutes" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggerInput" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_schedules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "workflow_schedules_workflowId_idx"
    ON "public"."workflow_schedules"("workflowId");
CREATE INDEX "workflow_schedules_isActive_nextRunAt_idx"
    ON "public"."workflow_schedules"("isActive", "nextRunAt");

ALTER TABLE "public"."workflow_schedules"
    ADD CONSTRAINT "workflow_schedules_workflowId_fkey"
    FOREIGN KEY ("workflowId") REFERENCES "public"."workflows"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
