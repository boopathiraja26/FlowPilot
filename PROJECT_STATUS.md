# FlowPilot Project Status

**Last updated:** 2026-11-13

## Current state

Repository baseline/documentation work and the initial workflow phases are complete. Phase 1 added generic JSON trigger execution and configurable AI/email steps. Phase 2 replaced the dashboard redirect with an overview sourced from authenticated workflow/execution APIs. Phase 3 added execution-time validation, strict context/template resolution, ordered fail-fast execution, and generic per-step logs. Phase 4 added workflow lifecycle actions and opt-in server-paginated execution history. Phase 5 added a durable Redis/BullMQ path while retaining the legacy synchronous endpoint. Phase 6 added encrypted user-scoped Gemini/SMTP integration management. Phase 7 added durable schedule management and scheduled workflow triggers. Phase 8 adds real-data owner-scoped execution analytics. Phase 9 adds profile editing and current-password-verified password changes.

FlowPilot's scope is a general AI-powered workflow automation platform, not an employee information form. Employee onboarding is one practical demo workflow. The application has a Next.js client, Express API, PostgreSQL/Prisma schema and migrations, registration/login/logout, workflow and step management, a React Flow builder, synchronous compatibility and durable queued execution paths, Gemini/SMTP/webhook integrations, a data-backed Dashboard, and execution history/detail screens. The run dialog accepts a generic JSON object; trigger, AI, and email values can be linked with templates. Provider-backed runtime success is not end-to-end verified.

## Target product areas

- **Core:** Dashboard (overview, metrics, recent activity, quick actions); Workflows (create/edit/activate/archive/duplicate/manage); Executions (history/logs/retry/failure diagnosis); Integrations (connect/manage services); Schedules (scheduled/recurring runs); Settings (profile/security/credentials/notifications).
- **Advanced:** Analytics (execution performance, trends, success rates).
- These are target capabilities, not claims that all areas are implemented. `/dashboard` shows persisted workflow and execution data; its all-time execution metrics use an owner-scoped server aggregate and its recent activity request is limited to five records.

## Known gaps

- The dashboard still loads the full owner-scoped workflow list for workflow counts and recent workflows. Execution metrics are all-time counts from authenticated `GET /api/analytics/dashboard-summary`; recent execution activity requests `GET /api/executions?page=1&limit=5`. This is not a real-time guarantee. The separate Analytics page provides 7/30/90-day UTC reporting.
- Execution history supports server pagination and status/workflow filters when query parameters are provided. Calls without query parameters preserve the existing full-list response shape and behavior for compatibility.
- The dashboard queues execution records in PostgreSQL and enqueues BullMQ jobs keyed by execution ID. A separate worker runs the existing validated execution engine. The API continues to expose the prior synchronous endpoint for compatibility.
- Automatic retries are disabled (one attempt, no stalled-job re-run) because external email/webhook actions are not idempotent. Worker restart requeues records still in `QUEUED`; a process/Redis/DB failure after a side effect can remain ambiguous, so this is not exactly-once delivery. Manual re-execution can repeat external effects.
- Trigger JSON for queued/running executions is persisted in PostgreSQL to make startup requeue possible and is cleared at terminal state; protect DB backups and establish a retention/privacy policy before production.
- New execution logs contain step status and generic messages only; trigger inputs, step outputs, and provider errors remain in memory and are not written to logs. Existing historical logs may still contain AI output. Gemini/SMTP credentials now have an encrypted user-scoped store; historical-log retention/redaction is not implemented.
- Workflow duplication clears nested credential-like configuration values, URL user-info, and sensitive URL query parameters; users must re-enter them on the copy. Existing workflows are not migrated and archive uses the existing `ARCHIVED` status enum.
- Account settings provide name/email editing and current-password-verified password changes. Notification preferences, MFA, and revocation of existing stateless JWT sessions are not implemented; Integrations remains a separate settings page.
- Advanced analytics now summarizes persisted execution records for selected 7/30/90-day UTC windows. It does not expose inputs/outputs and does not provide workflow-level comparisons or historical periods beyond 90 days.
- Scheduled runs use an additive database table and worker polling, described in the schedule phase below. Calendar cron/timezone support and inbound webhooks remain open work.
- Node.js built-in tests cover execution configuration, template resolution, data flow, fail-fast behavior, and queue configuration. No live Redis/PostgreSQL worker integration test has been run. Docker Compose starts only Redis; PostgreSQL, client, API, and worker run separately.
- README and architecture documentation were stale before this update; checked-in environment examples also do not list all server configuration variables.

## Baseline checks

Environment: Node.js `v24.14.0`, npm `11.9.0`. `npm ci` restored the locked dependencies without changing package manifests. Its npm audit summary reported **27 vulnerabilities** (9 moderate, 15 high, 3 critical); no audit remediation was attempted in this documentation-only step.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed; Next.js reported the existing `next lint` deprecation notice, with no ESLint warnings/errors. |
| `npm run typecheck --prefix client` | Passed. |
| `npm run typecheck --prefix server` | Passed after Prisma Client generation. The first attempt failed because generated Prisma model types were absent. |
| `npm run build` | Passed; client production build and server Prisma generation/TypeScript compilation completed. |
| `npm run lint --prefix server` | Exit code 0, but the script only prints a placeholder message and does not lint. |
| Tests | Not run: no test script or test/spec files were found. |

These are baseline results only; they do not establish runtime integration, database, or production readiness.

## First implementation phase checks

| Check | Result |
| --- | --- |
| `npm test` | Passed; server build succeeded and all 5 focused execution-configuration tests passed. |
| `npm run typecheck --prefix client` | Passed. |
| `npm run lint` | Passed; no ESLint warnings/errors (the existing Next.js deprecation notice remains). |
| `npm run build --prefix client` | Passed; production client build completed. |

No live database workflow, Gemini request, or SMTP send was run. No dependency or database/schema change was made.

## Dashboard phase checks

| Check | Result |
| --- | --- |
| `npm test` | Passed; server and client tests passed (5 server tests and 3 dashboard metric tests). |
| `npm run typecheck --prefix client` | Passed. |
| `npm run lint` | Passed; existing Next.js `next lint` deprecation notice remains. |
| `npm run build` | Passed; production client build and server Prisma generation/TypeScript compilation completed. |

No live database-backed dashboard session was available to capture a real screenshot: this worktree has no `.env`, `server/.env`, `client/.env.local`, or process `DATABASE_URL` configured. No API, schema, dependency, or deployment changes were made for this phase.

## Execution foundation phase checks

| Check | Result |
| --- | --- |
| `npm test` | Passed; server build and all 9 server tests passed, followed by all 3 client dashboard tests. |
| `npm run typecheck --prefix server` | Passed. |
| `npm run typecheck --prefix client` | Passed. |
| `npm run lint` | Passed; no ESLint warnings/errors, with the existing Next.js `next lint` deprecation notice. |
| `npm run build` | Passed; Next.js production build and Prisma generation/TypeScript compilation completed. |
| `git diff --check` | Passed. |

No live database, Gemini, SMTP, or webhook execution was run. No dependency or schema change was made. New step logs intentionally omit input, output, and provider error details; this improves data safety but limits diagnosis to step/status and generic messages. Existing historical logs are unchanged and may contain older AI output.

## Core management and monitoring phase checks

| Check | Result |
| --- | --- |
| `npm test` | Passed; 12 server tests and 3 client tests. |
| `npm run typecheck --prefix server` | Passed. |
| `npm run typecheck --prefix client` | Passed. |
| `npm run lint` | Passed; existing Next.js `next lint` deprecation notice remains. |
| `npm run build` | Passed; client production build and server Prisma generation/TypeScript compilation completed. |
| `git diff --check` | Passed. |

No live database workflow-management or execution-history request was run. The delay editor remains in milliseconds and server validation accepts `0` through the Node timer maximum (`2,147,483,647` ms); no seconds/unit conversion or separate product cap was added. Retry remains deferred because email/webhook actions can repeat side effects without durable idempotency support.

## Durable background execution phase

Implemented: the additive Prisma migration adds `QUEUED`, nullable `startedAt`, temporary `triggerInput`, and safe `failureReason` fields. The dashboard submits to a queue endpoint and polls execution detail; the prior synchronous endpoint remains available. A separate BullMQ worker invokes the existing validated execution engine. Jobs are keyed by execution ID, use one attempt, and fail stalled work instead of replaying side-effecting steps. Worker startup re-enqueues queued DB records by execution ID. Local Compose provides Redis AOF only.

| Check | Result |
| --- | --- |
| `npm test` | Passed; 15 server tests and 3 client tests. |
| `npm run typecheck --prefix client` | Passed. |
| `npm run typecheck --prefix server` | Passed. |
| `npm run lint` | Passed; no ESLint warnings/errors, with the existing Next.js `next lint` deprecation notice. |
| `npm run build` | Passed; Next.js production build and Prisma generation/server compilation completed. |
| `npx prisma validate --schema server/prisma/schema.prisma` | Passed with a nonconnecting placeholder `DATABASE_URL`; schema validation does not apply the migration. |
| Compose YAML parse | Passed with the local `js-yaml` parser. `docker compose config` could not run because Docker CLI is unavailable. |
| `git diff --check` | Passed; Git emitted only the configured LF-to-CRLF conversion warning for the Prisma schema. |

No live Redis/PostgreSQL worker integration or provider request was run. No migration was applied to any database. The worker's no-retry policy is not exactly-once delivery; a crash or data loss around an external side effect can leave an ambiguous execution requiring human inspection. Trigger JSON is retained only while queued/running and cleared at terminal state, but database backups require a production privacy/retention policy. `npm install` reported 12 dependency audit findings; none were remediated in this phase.

## Secure integrations phase

Implemented user-scoped Gemini/SMTP credential management. The additive Prisma migration creates `user_integrations` with a unique user/provider pair and ciphertext-only credential storage; it has not been applied to a database. AES-256-GCM uses a versioned format with authenticated user/provider context and requires a server-only 32-byte key encoded as 64 hex characters. Authenticated endpoints list safe status, save/update credentials, and disconnect; all persistence queries are scoped by authenticated user ID. The Integrations page uses write-only secret fields and does not request or prefill saved secrets. Workflow Gemini/SMTP steps and authenticated AI generation use the user's saved credentials when present and otherwise retain server environment fallback. SMTP transport cache entries are per user and invalidated on update/disconnect.

| Check | Result |
| --- | --- |
| `npm test --prefix server` | Passed; server build and all 21 server tests passed, including encryption/decryption, tamper/version/key/context rejection, user-scope filters, response redaction, and prior execution tests. |
| `npm run build --prefix client` | Passed; production build completed with `/dashboard/integrations` included. |
| `npm run lint` | Passed; no ESLint warnings/errors, with the existing Next.js `next lint` deprecation notice. |
| `npx prisma validate --schema prisma\\schema.prisma` | Passed using a placeholder `DATABASE_URL`; no connection or migration was attempted. |
| `git diff --check` | Passed after normalizing the edited email service line endings; only Git's existing schema LF-to-CRLF warning remains. |

No single root `npm run build` was run; the server build/test and client production build completed separately. No live PostgreSQL migration, Redis worker, Gemini request, or SMTP send was run. Provider credentials were unavailable. The encryption key is not recoverable from the database: back it up separately and retain it with DB backups; no key rotation/re-encryption utility exists. The new migration must be reviewed and applied only to an intended development database before using the feature.

## Schedule and scheduled-trigger phase

Implemented durable one-time and recurring schedules for active workflows. The additive `workflow_schedules` migration stores UTC first/next-run timestamps, an optional interval from 5 minutes to 1 year, enabled state, and generic JSON trigger input. Authenticated owner-scoped routes list, create, pause/resume, and remove schedules; response summaries omit stored trigger input. The UI is at `/dashboard/schedules`. The worker polls every 15 seconds, atomically claims each occurrence and creates its queued execution in the same PostgreSQL transaction, then enqueues by execution ID. Existing startup recovery handles a crash between DB commit and queue insertion. If an enqueue fails, the occurrence is marked failed and is not retried. After downtime, missed intervals coalesce to one occurrence and the next interval starts at dispatch time. Each recurrence is a new scheduled execution, not a retry.

The schedule payload rejects credential-like field names and remains in PostgreSQL for the schedule's lifetime; avoid secrets and unnecessary personal data. Deactivated workflows defer their schedules until reactivated. Removing or pausing a schedule does not cancel an execution already queued. Calendar cron/timezone recurrence, inbound webhook triggers, per-user schedule quotas, and live DB/Redis concurrency checks are not implemented.

| Check | Result |
| --- | --- |
| `npm test` | Passed; 26 server tests and 3 client tests. |
| `npm run build --prefix client` | Passed; production build included `/dashboard/schedules`. |
| `npm run typecheck --prefix client` | Passed after the production build. |
| `npm run lint` | Passed; existing Next.js `next lint` deprecation notice remains. |
| `npx prisma validate --schema prisma\\schema.prisma` | Passed with a placeholder `DATABASE_URL`; no connection or migration was attempted. |
| `git diff --check` | Passed; Git emitted only the schema LF-to-CRLF conversion warning. |

No schedule migration was applied. PostgreSQL transaction/worker behavior and Redis dispatch were not live-tested because runtime services are unavailable; schedule correctness is verified by compilation, schema validation, and focused pure validation/ownership/cadence tests.

## Real-data analytics phase

Implemented authenticated `GET /api/analytics?days=7|30|90` and `/dashboard/analytics`. The API uses a parameterized PostgreSQL aggregate query scoped through the authenticated user's workflows. It returns daily counts by execution status, total outcomes, terminal success rate (completed / completed + failed), and average duration for completed runs with valid timestamps. The UI presents real API results, date-range selection, an accessible status chart plus exact daily table, and loading/error/empty states. No analytics migration or dependency was added.

| Check | Result |
| --- | --- |
| `npm test` | Passed; server build and all 31 server tests, plus all 3 client tests. |
| `npm run build --prefix client` | Passed; production build included `/dashboard/analytics`. |
| `npm run typecheck --prefix client` | Passed after the production build. |
| `npm run typecheck --prefix server` | Passed. |
| `npm run lint:client` | Passed with no ESLint warnings/errors; existing Next.js `next lint` deprecation notice remains. |
| `npx prisma validate --schema prisma\\schema.prisma` | Passed with a placeholder `DATABASE_URL`; this validates the schema without connecting or applying migrations. |

Analytics SQL and aggregation behavior were tested without a live PostgreSQL connection. Runtime database execution, query performance on production-sized data, and a real-data screenshot were not verified; this worktree has no configured application environment or database credentials, and no migrations were applied. Analytics is limited to UTC calendar-day ranges of 7/30/90 days and does not provide per-workflow comparisons or expose execution inputs/outputs.

## Account settings phase

Implemented authenticated profile read/update (`GET/PATCH /api/auth/me`) and password change (`POST /api/auth/password`). Profile updates accept only name and email and use the authenticated user ID for reads and writes. Password changes require current-password verification, enforce the registration password-complexity rules, hash with bcrypt, clear client form values after submission, and never return or log password data. A follow-up added the additive `passwordVersion` field so password changes revoke older JWTs while returning a replacement token to the active session; profile updates do not increment it. The migration is checked in but has not been applied.

| Check | Result |
| --- | --- |
| `npm test --prefix server` | Passed; server build and all 38 server tests, including password-version compatibility and invalidation tests. |
| `npm test --prefix client` | Passed; all 3 client tests. |
| `npm run typecheck --prefix client` | Passed. |
| `npm run typecheck --prefix server` | Passed. |
| `npm run build --prefix client` | Passed; production build included `/dashboard/settings`. |
| `npm run lint` | Passed; no client ESLint warnings/errors, with the existing Next.js `next lint` deprecation notice. |
| `npx prisma validate --schema prisma\\schema.prisma` | Passed using a placeholder URL; no database connection or migration was attempted. |

Password changes increment `passwordVersion`, which invalidates older stateless JWTs on their next authenticated request; the active browser receives a replacement token. Legacy tokens without the claim remain valid as version 0 until a password change. No database migration or production deployment was attempted.

## Responsive/accessibility polish and release verification

Added shared keyboard focus indicators, input error announcements/associations, reduced-motion support, keyboard focus trapping/restoration and Escape handling for dialogs, a mobile overlay navigation drawer, and mobile-safe workflow cards and step dialogs. These changes do not redesign the application or alter workflow execution behavior.

The public homepage now labels workflow animations, sample payloads, outputs, statuses, timings, and logs as illustrative only. Provider capability copy says Gemini/SMTP credentials must be configured; the authenticated dashboard remains the source of persisted run status.

| Check | Result |
| --- | --- |
| `npm test` | Passed; server build and all 41 server tests passed, followed by all 5 client tests. |
| `npm run build --prefix client` | Passed after the dashboard aggregation update; production build completed for all 14 routes. |
| `npm run typecheck --prefix client` / `npm run typecheck --prefix server` | Both passed after the dashboard aggregation update. |
| `npm run lint` | Passed; no client warnings/errors; Next.js reports that `next lint` is deprecated. |
| `npm run lint --prefix server` | Exited successfully but is a placeholder and does not lint server code. |
| `npx prisma validate` | Passed with a nonconnecting placeholder `DATABASE_URL`; validates schema without contacting a database or applying migrations. |
| Migration destructive-SQL scan | No `DROP TABLE/COLUMN/TYPE/INDEX`, `TRUNCATE`, or `DELETE FROM` patterns found; no migration was applied. |
| `git diff --check` and changed-file secret-pattern scan | Passed; no recognized live-secret signatures in 87 changed paths. |

The dashboard follow-up preserves lifetime execution totals and success rate with an authenticated, user-scoped database aggregate, and requests only the five newest execution records for recent activity. The browser preview is available at `http://localhost:3001`; opening `/dashboard` without an authenticated session redirects to `/login`. The API was intentionally not started: no `.env`, `server/.env`, `client/.env.local`, or process `DATABASE_URL`/`REDIS_URL` is configured, and the existing services on ports 3000/5000 belong to another worktree. The preview does not access those services. Live authenticated data-isolation requests, database query performance, Redis dispatch, provider calls, and deployment remain unverified. Project release readiness is therefore not complete.

The account-settings phase added one additive migration to `users.passwordVersion`; no migration was applied. Existing queue tests confirm jobs are keyed by execution and not automatically retried; schedule tests cover owner scope and cadence. These are unit-level checks, not live Redis/PostgreSQL recovery or concurrency tests. A frontend-only preview from this worktree is running at `http://localhost:3001`; the login page loaded and a screenshot was captured. The API was intentionally not started: no `.env`, `server/.env`, `client/.env.local`, or process `DATABASE_URL`/`REDIS_URL` is configured, and the existing services on ports 3000/5000 belong to another worktree. The preview points to unused port 5001 and does not access those services. Live authentication/data-isolation requests, provider calls, Redis dispatch, deployment, monitoring, and recovery remain unverified. Project release readiness is therefore not complete.

## Remaining work

Validate the application against an explicitly configured development database and Redis, run end-to-end account/workflow/provider flows, and add production monitoring/recovery and retention procedures. Further accessibility findings require real browser testing. No production deployment is authorized.
