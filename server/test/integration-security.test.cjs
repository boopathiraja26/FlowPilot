const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  decryptIntegrationCredentials,
  encryptIntegrationCredentials,
  parseIntegrationEncryptionKey,
} = require("../dist/utils/integrationCrypto.js");
const {
  buildIntegrationUserFilter,
  buildIntegrationWhere,
  toIntegrationStatus,
} = require("../dist/services/integration.service.js");
const { IntegrationProvider } = require("@prisma/client");

const key = "a".repeat(64);
const context = { userId: "user-a", provider: "GEMINI" };

test("integration credentials encrypt and decrypt with the versioned format", () => {
  const credentials = { apiKey: "private-provider-token" };
  const encrypted = encryptIntegrationCredentials(credentials, key, context);

  assert.match(encrypted, /^v1:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/);
  assert.notEqual(encrypted.includes(credentials.apiKey), true);
  assert.deepEqual(decryptIntegrationCredentials(encrypted, key, context), credentials);
});

test("integration encryption uses a fresh nonce and rejects tampering", () => {
  const credentials = { apiKey: "private-provider-token" };
  const first = encryptIntegrationCredentials(credentials, key, context);
  const second = encryptIntegrationCredentials(credentials, key, context);
  assert.notEqual(first, second);

  const parts = first.split(":");
  parts[3] = `${parts[3][0] === "A" ? "B" : "A"}${parts[3].slice(1)}`;
  assert.throws(
    () => decryptIntegrationCredentials(parts.join(":"), key, context),
    { message: "Invalid encrypted integration credentials." }
  );
});

test("integration encryption rejects malformed keys and unknown formats", () => {
  assert.throws(() => parseIntegrationEncryptionKey("short"), /64 hexadecimal/);
  assert.throws(() => encryptIntegrationCredentials({}, "z".repeat(64), context), /64 hexadecimal/);
  assert.throws(
    () => decryptIntegrationCredentials("v2:iv:tag:data", key, context),
    { message: "Invalid encrypted integration credentials." }
  );
});

test("integration ciphertext cannot be moved to another user or provider", () => {
  const encrypted = encryptIntegrationCredentials({ apiKey: "private" }, key, context);
  assert.throws(
    () =>
      decryptIntegrationCredentials(
        encrypted,
        key,
        { userId: "user-b", provider: "GEMINI" }
      ),
    { message: "Invalid encrypted integration credentials." }
  );
  assert.throws(
    () =>
      decryptIntegrationCredentials(
        encrypted,
        key,
        { userId: "user-a", provider: "SMTP" }
      ),
    { message: "Invalid encrypted integration credentials." }
  );
});
test("integration lookup filters are scoped to the authenticated user", () => {
  assert.deepEqual(
    buildIntegrationWhere("user-a", IntegrationProvider.GEMINI),
    { userId_provider: { userId: "user-a", provider: "GEMINI" } }
  );
  assert.deepEqual(buildIntegrationUserFilter("user-a"), { userId: "user-a" });
});

test("integration status exposes only connection state and timestamp", () => {
  const status = toIntegrationStatus(IntegrationProvider.SMTP, {
    updatedAt: new Date("2026-01-02T03:04:05.000Z"),
    encryptedCredentials: "ciphertext-must-not-leak",
    userId: "user-a",
  });

  assert.deepEqual(status, {
    provider: "SMTP",
    connected: true,
    updatedAt: "2026-01-02T03:04:05.000Z",
  });
  assert.equal(JSON.stringify(status).includes("ciphertext"), false);
  assert.equal(JSON.stringify(status).includes("user-a"), false);
});
