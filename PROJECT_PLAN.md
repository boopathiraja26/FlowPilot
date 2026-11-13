# FlowPilot Product Plan

## Goal

FlowPilot is a general AI-powered workflow automation platform: users visually connect triggers and actions, execute workflows with data passed between steps, and inspect results. Employee onboarding is one useful demonstration workflow, not the product's scope.

Deliver a reliable portfolio-ready product without replacing the existing Next.js/Express/Prisma stack or rewriting working features. Billing, quotas, support operations, privacy policies, tenant administration, and commercial SaaS operations are outside the first portfolio release.

## Target application structure

| Area | Priority | Intended capability |
| --- | --- | --- |
| Dashboard | Core | Overview, real execution metrics, recent activity, and quick actions. |
| Workflows | Core | Create, edit, activate, archive, duplicate, and manage workflows. |
| Executions | Core | History, step logs, failure diagnosis, and safe recovery/retry. |
| Integrations | Core | Connect and securely manage external services and credentials. |
| Schedules | Core | Schedule and recur workflow runs. |
| Settings | Core | Profile, security, credentials, and notification preferences. |
| Analytics | Advanced | Execution performance, trends, and success rates from real data. |

This is the target product structure, not a claim that every area currently exists.

## Current architecture

- Next.js 15 App Router, React, TypeScript, Tailwind CSS, and React Flow client.
- Express/TypeScript API with PostgreSQL through Prisma.
- bcrypt password hashing and JWT authentication through an HTTP-only cookie.
- Workflow steps currently include trigger, Gemini AI, SMTP email, delay, and webhook handlers.
- See `docs/architecture.md` and `TECHNICAL_DECISIONS.md` for implementation boundaries and open decisions.

## Prioritized roadmap

1. **End-to-end onboarding demonstration (first implementation phase).** Implemented the generic manual JSON trigger runner, configurable AI prompt/email steps, onboarding example payload, and display of persisted execution results. Provider-backed runtime success still requires local Gemini, SMTP, and database configuration and has not been verified here.
2. **Core application structure and UI.** Implemented the real-data Dashboard overview using the existing authenticated workflow/execution APIs, with status/outcome metrics, recent workflows/activity, quick actions, and loading/empty/error states. The React Flow builder remains unchanged.
3. **Execution correctness and observability.** Implemented execution-time step configuration validation, deterministic ordered execution, strict trigger/prior-step template resolution (including `{{step_1.employee_email}}`), and fail-fast behavior. New step logs persist status and generic messages only; inputs, outputs, and provider error details are not persisted. Focused tests cover these contracts. Detailed diagnosis, structured outputs, and historical-log redaction remain open data-policy work.
4. **Core management and monitoring.** Partially implemented: workflows can be activated/deactivated, archived/restored, and duplicated as drafts; execution history supports bounded server-side pagination and status/workflow filters while preserving the legacy no-query response. Duplicate copies scrub credential-like fields and URL credentials. Integrations are user-scoped and encrypted. Retry is deferred until durable idempotency can prevent repeated email/webhook side effects.
5. **Analytics (advanced).** Implemented owner-scoped 7/30/90-day execution counts, outcomes, success rate, average duration, and daily trends from persisted execution records. Long-range analytics and additional workflow-level comparisons remain future enhancements.
6. **Durable background execution.** Implemented Redis/BullMQ queueing, a separate worker, database-backed queued/running states, and a conservative no-automatic-retry boundary for workflows with external side effects. This does not claim exactly-once delivery.
7. **Secure Integrations.** Implemented user-scoped encrypted Gemini/SMTP credential storage, authenticated status/save/disconnect endpoints, and write-only settings UI with server-environment fallback. Live provider validation remains configuration-dependent.
8. **Schedules and scheduled triggers.** Implemented durable one-time and recurring triggers for active workflows, owner-scoped schedule management, and queueing each occurrence through the existing worker. This initial contract uses UTC timestamps and bounded minute intervals rather than calendar cron.
9. **Remaining Core areas.** Implemented account name/email editing and current-password-verified password changes that invalidate old sessions. Notification preferences, broader security controls, and signed/rate-limited inbound webhook triggers remain open.
10. **Responsive/accessibility and production readiness.** Improve keyboard focus, dialog semantics, reduced-motion behavior, and mobile navigation, then validate authorization/data isolation, migrations, queues, schedules, runtime configuration, monitoring, recovery, and retention. Live runtime and production checks remain environment-dependent; no production deployment is authorized by this plan.

Continue in reviewable phases. Notification preferences and broader security controls remain future work; no production deployment is authorized by this plan.

## Delivery rules

- Preserve existing behavior and keep changes phase-sized.
- Establish baseline checks before implementation; test changed behavior and inspect each final diff for secrets.
- Avoid dependencies, database changes, infrastructure, and production deployment unless the approved phase requires them.
- Do not describe unverified behavior as complete. Do not start the next feature phase until it is approved.
