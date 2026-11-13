import { z } from "zod";

const secretLikeKey =
  /(?:password|passwd|secret|token|api[_-]?key|authorization|credential)/i;

function hasSecretLikeKey(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(hasSecretLikeKey);
  }
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return Object.entries(value).some(
    ([key, nestedValue]) =>
      secretLikeKey.test(key) || hasSecretLikeKey(nestedValue)
  );
}

export const createScheduleSchema = z
  .object({
    workflowId: z.string().uuid(),
    firstRunAt: z.string().datetime({ offset: true }),
    intervalMinutes: z.number().int().min(5).max(525600).optional(),
    triggerInput: z.record(z.string(), z.unknown()).default({}),
  })
  .strict()
  .superRefine((schedule, context) => {
    if (new Date(schedule.firstRunAt).getTime() <= Date.now()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["firstRunAt"],
        message: "The first run time must be in the future.",
      });
    }
    if (hasSecretLikeKey(schedule.triggerInput)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["triggerInput"],
        message: "Trigger input must not contain credential-like fields.",
      });
    }
  });

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;

export const updateScheduleSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

export const scheduleIdParamSchema = z.object({
  id: z.string().uuid(),
});

export function getNextScheduleRun(
  now: Date,
  intervalMinutes: number | null
): Date | null {
  if (intervalMinutes === null) return null;
  return new Date(now.getTime() + intervalMinutes * 60_000);
}
