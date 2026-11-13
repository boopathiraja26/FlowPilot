CREATE TYPE "public"."IntegrationProvider" AS ENUM ('GEMINI', 'SMTP');

CREATE TABLE "public"."user_integrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "public"."IntegrationProvider" NOT NULL,
    "encryptedCredentials" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_integrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_integrations_userId_provider_key"
    ON "public"."user_integrations"("userId", "provider");

ALTER TABLE "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "public"."users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
