import {
  IntegrationProvider,
  Prisma,
  UserIntegration,
} from "@prisma/client";

import prisma from "../lib/prisma";
import { ApiError } from "../middleware/errorHandler";
import { env } from "../config/env";
import {
  decryptIntegrationCredentials,
  encryptIntegrationCredentials,
} from "../utils/integrationCrypto";
import {
  GeminiCredentials,
  SmtpCredentials,
  geminiCredentialsSchema,
  smtpCredentialsSchema,
} from "../validators/integration.validation";

const integrationProviders = [
  IntegrationProvider.GEMINI,
  IntegrationProvider.SMTP,
] as const;

export interface IntegrationStatus {
  provider: IntegrationProvider;
  connected: boolean;
  updatedAt: string | null;
}

export function buildIntegrationWhere(
  userId: string,
  provider: IntegrationProvider
): Prisma.UserIntegrationWhereUniqueInput {
  return {
    userId_provider: { userId, provider },
  };
}

export function buildIntegrationUserFilter(
  userId: string
): Prisma.UserIntegrationWhereInput {
  return { userId };
}

export function toIntegrationStatus(
  provider: IntegrationProvider,
  integration: Pick<UserIntegration, "updatedAt"> | null
): IntegrationStatus {
  return {
    provider,
    connected: Boolean(integration),
    updatedAt: integration?.updatedAt.toISOString() ?? null,
  };
}

export async function listIntegrations(
  userId: string
): Promise<IntegrationStatus[]> {
  const integrations = await prisma.userIntegration.findMany({
    where: buildIntegrationUserFilter(userId),
    select: {
      provider: true,
      updatedAt: true,
    },
  });
  const byProvider = new Map(
    integrations.map((integration) => [integration.provider, integration])
  );

  return integrationProviders.map((provider) =>
    toIntegrationStatus(provider, byProvider.get(provider) ?? null)
  );
}

export async function saveIntegration(
  userId: string,
  provider: IntegrationProvider,
  credentials: GeminiCredentials | SmtpCredentials
): Promise<IntegrationStatus> {
  const encryptedCredentials = encryptIntegrationCredentials(
    credentials,
    env.integrationEncryptionKey,
    { userId, provider }
  );

  const integration = await prisma.userIntegration.upsert({
    where: buildIntegrationWhere(userId, provider),
    create: {
      userId,
      provider,
      encryptedCredentials,
    },
    update: { encryptedCredentials },
  });

  return toIntegrationStatus(provider, integration);
}

export async function disconnectIntegration(
  userId: string,
  provider: IntegrationProvider
): Promise<IntegrationStatus> {
  await prisma.userIntegration.deleteMany({
    where: {
      ...buildIntegrationUserFilter(userId),
      provider,
    },
  });

  return toIntegrationStatus(provider, null);
}

async function loadCredentials(
  userId: string,
  provider: IntegrationProvider
): Promise<Record<string, unknown> | null> {
  const integration = await prisma.userIntegration.findUnique({
    where: buildIntegrationWhere(userId, provider),
    select: { encryptedCredentials: true },
  });

  if (!integration) return null;

  try {
    return decryptIntegrationCredentials(
      integration.encryptedCredentials,
      env.integrationEncryptionKey,
      { userId, provider }
    );
  } catch {
    throw new ApiError(
      500,
      "Saved integration credentials are unavailable. Verify the server encryption-key configuration."
    );
  }
}

export async function getGeminiCredentials(
  userId: string
): Promise<GeminiCredentials | null> {
  const credentials = await loadCredentials(userId, IntegrationProvider.GEMINI);
  if (!credentials) return null;

  const parsed = geminiCredentialsSchema.safeParse(credentials);
  if (!parsed.success) {
    throw new ApiError(500, "Saved Gemini credentials are invalid.");
  }
  return parsed.data;
}

export async function getSmtpCredentials(
  userId: string
): Promise<SmtpCredentials | null> {
  const credentials = await loadCredentials(userId, IntegrationProvider.SMTP);
  if (!credentials) return null;

  const parsed = smtpCredentialsSchema.safeParse(credentials);
  if (!parsed.success) {
    throw new ApiError(500, "Saved SMTP credentials are invalid.");
  }
  return parsed.data;
}
