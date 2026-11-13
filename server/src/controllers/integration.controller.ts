import { Request, Response } from "express";
import { IntegrationProvider } from "@prisma/client";

import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../middleware/errorHandler";
import { invalidateUserSmtpTransporter } from "../services/email.service";
import {
  disconnectIntegration,
  listIntegrations,
  saveIntegration,
} from "../services/integration.service";
import {
  geminiCredentialsSchema,
  integrationProviderSchema,
  smtpCredentialsSchema,
} from "../validators/integration.validation";

function getUserId(req: Request): string {
  if (!req.user?.id) {
    throw new ApiError(401, "Authentication required");
  }
  return req.user.id;
}

function getProvider(value: string): IntegrationProvider {
  const parsed = integrationProviderSchema.safeParse(value);
  if (!parsed.success) {
    throw new ApiError(400, "Provider must be GEMINI or SMTP.");
  }
  return parsed.data;
}

export const findAll = asyncHandler(async (req: Request, res: Response) => {
  const integrations = await listIntegrations(getUserId(req));
  res.status(200).json({
    success: true,
    data: { integrations },
  });
});

export const save = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const provider = getProvider(req.params.provider);
  const schema =
    provider === IntegrationProvider.GEMINI
      ? geminiCredentialsSchema
      : smtpCredentialsSchema;
  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(
      400,
      "Integration credentials are invalid.",
      parsed.error.flatten().fieldErrors
    );
  }

  const integration = await saveIntegration(userId, provider, parsed.data);
  if (provider === IntegrationProvider.SMTP) {
    invalidateUserSmtpTransporter(userId);
  }
  res.status(200).json({
    success: true,
    message: "Integration credentials saved.",
    data: { integration },
  });
});

export const disconnect = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const provider = getProvider(req.params.provider);
    const integration = await disconnectIntegration(
      userId,
      provider
    );
    if (provider === IntegrationProvider.SMTP) {
      invalidateUserSmtpTransporter(userId);
    }
    res.status(200).json({
      success: true,
      message: "Integration disconnected.",
      data: { integration },
    });
  }
);
