# FlowPilot

FlowPilot is a workflow-automation application with a Next.js client and an Express API. The current implementation supports authenticated workflow management, an AI-assisted React Flow builder, manual workflow execution, and execution history. It is an active product prototype; the production-readiness items in the roadmap are not yet complete.

## Architecture

- `client/` — Next.js 15 App Router, React, TypeScript, Tailwind CSS, and React Flow.
- `server/` — Express and TypeScript API, Prisma client, authentication, workflow execution, and Gemini/SMTP/webhook integrations.
- `server/prisma/` — PostgreSQL schema and migrations.
- `docs/architecture.md` — current architecture and implementation boundaries.
- `PROJECT_PLAN.md`, `PROJECT_STATUS.md`, `TECHNICAL_DECISIONS.md` — roadmap, verified status, and decisions.

The public landing page contains illustrative workflow animations, sample outputs, statuses, and logs. They do not execute workflows or indicate that provider credentials are configured; use the authenticated dashboard to view persisted execution history.

## Local development

Requirements: Node.js 18.18 or later and npm 9 or later.

1. Install the locked workspace dependencies with `npm ci` (or use `npm run install:all` for the repository's install script).
2. Create local environment files from the root, client, and server examples. Do not commit local environment files.
3. Configure the client API URL and server values for PostgreSQL (`DATABASE_URL`), Redis (`REDIS_URL`), JWT (`JWT_SECRET`), and optional server-wide Gemini/SMTP fallback credentials. To save user-scoped credentials in Integrations, generate `INTEGRATION_ENCRYPTION_KEY` with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and put the 64-character hex value in `server/.env` only. Never expose or commit this key.
4. Start local Redis with `docker compose up -d redis`. The Compose file starts Redis only; the client, API, worker, and PostgreSQL still run separately.
5. Apply migrations to a local development database with `npm run migrate --prefix server`. Review migrations before applying them to any other database. The user-integration migration is additive and is not applied automatically by this project.
6. Start the client and API with `npm run dev`, then start the separate background worker with `npm run dev:worker` in another terminal. The worker polls durable schedules every 15 seconds. Defaults are `http://localhost:3000` and `http://localhost:5000`.

The database must be provisioned and migrations applied before using database-backed API features. Do not use real credentials in examples, screenshots, or commits. The worker persists queued trigger JSON in PostgreSQL only until execution reaches a terminal state, then clears it. Protect database backups and configure an appropriate retention/privacy policy for production.

User-saved Gemini and SMTP credentials are encrypted server-side with AES-256-GCM. The encryption key is not stored in PostgreSQL: protect it separately, include it in secure backups, and keep it consistent when restoring the database. Losing the key makes saved credentials unreadable. There is no automated key-rotation utility; changing the key requires re-entering saved credentials or a separately planned re-encryption operation. Users without saved credentials continue to use server environment configuration.

## Available checks and commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run client and server in development |
| `docker compose up -d redis` | Start local Redis with append-only persistence |
| `npm run dev:worker` | Run the separate BullMQ worker in development |
| `npm run migrate --prefix server` | Apply checked-in Prisma migrations to the configured database |
| `npm run build` | Build client, generate Prisma Client, and compile server |
| `npm run lint` | Run the client lint script |
| `npm run typecheck --prefix client` | Typecheck client |
| `npm run typecheck --prefix server` | Typecheck server (requires generated Prisma Client) |
| `npm test` | Build the server and run focused server execution/queue/management/analytics/account-settings and client tests |

The server lint script is a placeholder that exits successfully without running a linter. The test command does not replace database-backed integration or end-to-end coverage.

## Current API surface

- `GET /api/health`
- `POST /api/auth/register`, `/api/auth/login`, `/api/auth/logout`
- Authenticated workflow and workflow-step CRUD/reordering
- Authenticated `GET /api/auth/me` and `PATCH /api/auth/me` for the current user's profile; `POST /api/auth/password` verifies the current password, invalidates older sessions, and returns a replacement token for the active session
- Workflow activation/deactivation, archive/restore, and credential-scrubbed duplication
- Authenticated AI workflow generation
- Authenticated `GET /api/integrations`, `PUT /api/integrations/:provider`, and `DELETE /api/integrations/:provider`; responses expose connection status and update time only. Saved secrets are write-only in the client.
- Authenticated `GET /api/schedules`, `POST /api/schedules`, `PATCH /api/schedules/:id`, and `DELETE /api/schedules/:id` for one-time and recurring workflow runs.
- Authenticated `GET /api/analytics/dashboard-summary` for all-time owner-scoped execution counts; the dashboard loads only the five newest execution records for its recent-activity list.
- Authenticated `GET /api/analytics?days=7|30|90` for owner-scoped execution totals, status outcomes, completed-run duration, and daily trends from persisted workflow executions.
- Authenticated synchronous workflow execution for compatibility; the dashboard uses `POST /api/executions/:workflowId/queue` and polls the existing execution-detail endpoint for queued/running/terminal status
- Paginated/filterable execution history and execution details, including safe failure reasons

See the route files under `server/src/routes/` for the implemented endpoints. Analytics covers executions created during the selected UTC calendar-day window; success rate uses only completed and failed runs, and average duration includes completed runs with valid start/end timestamps. Execution history accepts `page`, `limit` (maximum 100), `status`, and `workflowId` query parameters; omitting all query parameters preserves the legacy full-list response. Queue jobs are keyed by execution ID, have one attempt, and are not automatically retried after worker stalls because workflow steps may send email or call webhooks. This is at-most-one worker attempt, not exactly-once external delivery; failed executions require a human to inspect possible side effects before starting a new run. Calendar-cron/timezone schedules, inbound webhooks, idempotency keys for external providers, and a full production Docker deployment are not implemented.
