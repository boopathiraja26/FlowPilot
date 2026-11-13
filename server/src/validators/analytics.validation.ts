import { z } from "zod";

export const analyticsQuerySchema = z
  .object({
    days: z.coerce.number().int().refine(
      (value) => value === 7 || value === 30 || value === 90,
      "Days must be 7, 30, or 90."
    ).default(30),
  })
  .strict();

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
