# FlowPilot Architecture (Phase 1 - Initialization)

This document is a placeholder for architecture notes as the project evolves.

## Current phase scope

- Monorepo scaffolding (client + server)
- No database, ORM, cache, containerization, or authentication logic yet

## Structure

- `client/` - Next.js 15 (App Router) + TypeScript + Tailwind CSS frontend
- `server/` - Express + TypeScript backend API
- `docs/` - project documentation

## Planned (future phases)

- PostgreSQL + Prisma for persistence
- Redis for caching / rate-limit store
- Full JWT authentication (access + refresh token flow)
- Docker Compose implementation (client, server, db, cache)
- CI/CD pipeline
