import { z } from "zod";

export const integrationProviderSchema = z.enum(["GEMINI", "SMTP"]);

export const geminiCredentialsSchema = z
  .object({
    apiKey: z.string().trim().min(1).max(4096),
  })
  .strict();

export const smtpCredentialsSchema = z
  .object({
    host: z.string().trim().min(1).max(255),
    port: z.coerce.number().int().min(1).max(65535),
    user: z.string().trim().min(1).max(320),
    pass: z.string().min(1).max(4096),
    from: z.string().trim().email().max(320),
  })
  .strict();

export type GeminiCredentials = z.infer<typeof geminiCredentialsSchema>;
export type SmtpCredentials = z.infer<typeof smtpCredentialsSchema>;
