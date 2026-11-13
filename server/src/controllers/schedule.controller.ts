import { Request, Response } from "express";

import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../middleware/errorHandler";
import {
  createWorkflowSchedule,
  deleteWorkflowSchedule,
  listWorkflowSchedules,
  setWorkflowScheduleActive,
} from "../services/schedule.service";
import {
  createScheduleSchema,
  scheduleIdParamSchema,
  updateScheduleSchema,
} from "../validators/schedule.validation";

function getUserId(req: Request): string {
  if (!req.user?.id) {
    throw new ApiError(401, "Authentication required");
  }
  return req.user.id;
}

function getScheduleId(req: Request): string {
  const parsed = scheduleIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new ApiError(400, "Schedule ID is invalid.");
  }
  return parsed.data.id;
}

export const findAll = asyncHandler(async (req: Request, res: Response) => {
  const schedules = await listWorkflowSchedules(getUserId(req));
  res.status(200).json({ success: true, data: { schedules } });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createScheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(
      400,
      "Schedule configuration is invalid.",
      parsed.error.flatten().fieldErrors
    );
  }

  const schedule = await createWorkflowSchedule(getUserId(req), parsed.data);
  res.status(201).json({
    success: true,
    message: "Schedule created.",
    data: { schedule },
  });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateScheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Schedule status is invalid.");
  }

  const schedule = await setWorkflowScheduleActive(
    getUserId(req),
    getScheduleId(req),
    parsed.data.isActive
  );
  res.status(200).json({
    success: true,
    message: "Schedule updated.",
    data: { schedule },
  });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await deleteWorkflowSchedule(getUserId(req), getScheduleId(req));
  res.status(200).json({
    success: true,
    message: "Schedule removed. Already queued executions are not cancelled.",
  });
});
