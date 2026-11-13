import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const CIPHERTEXT_VERSION = "v1";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export interface IntegrationEncryptionContext {
  userId: string;
  provider: "GEMINI" | "SMTP";
}

function associatedData(context: IntegrationEncryptionContext): Buffer {
  return Buffer.from(
    `flowpilot:user-integration:${context.provider}:${context.userId}`,
    "utf8"
  );
}

export function parseIntegrationEncryptionKey(value?: string): Buffer {
  if (!value || !/^[0-9a-f]{64}$/i.test(value)) {
    throw new Error(
      "INTEGRATION_ENCRYPTION_KEY must be configured as exactly 64 hexadecimal characters."
    );
  }

  return Buffer.from(value, "hex");
}

function decodeBase64Url(value: string): Buffer {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error("Invalid encrypted integration credentials.");
  }

  const decoded = Buffer.from(value, "base64url");
  if (decoded.toString("base64url") !== value) {
    throw new Error("Invalid encrypted integration credentials.");
  }
  return decoded;
}

export function encryptIntegrationCredentials(
  credentials: Record<string, unknown>,
  encryptionKey: string | undefined,
  context: IntegrationEncryptionContext
): string {
  const key = parseIntegrationEncryptionKey(encryptionKey);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(associatedData(context));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(credentials), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    CIPHERTEXT_VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

export function decryptIntegrationCredentials(
  encoded: string,
  encryptionKey: string | undefined,
  context: IntegrationEncryptionContext
): Record<string, unknown> {
  const key = parseIntegrationEncryptionKey(encryptionKey);
  const parts = encoded.split(":");
  if (parts.length !== 4 || parts[0] !== CIPHERTEXT_VERSION) {
    throw new Error("Invalid encrypted integration credentials.");
  }

  try {
    const iv = decodeBase64Url(parts[1]);
    const authTag = decodeBase64Url(parts[2]);
    const ciphertext = decodeBase64Url(parts[3]);
    if (
      iv.length !== IV_LENGTH ||
      authTag.length !== AUTH_TAG_LENGTH ||
      ciphertext.length === 0
    ) {
      throw new Error("Invalid encrypted integration credentials.");
    }

    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAAD(associatedData(context));
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
    const parsed: unknown = JSON.parse(plaintext);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Invalid encrypted integration credentials.");
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error("Invalid encrypted integration credentials.");
  }
}
