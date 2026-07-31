# FlowPilot

A production-ready monorepo scaffold with a Next.js 15 client and an Express
+ TypeScript server.

> **Phase status:** This is the project **initialization / architecture**
> phase only. There is no database, ORM (Prisma), Redis, Docker
> implementation, or authentication logic yet — those are placeholders /
> structure for a future phase.

## Folder structure

```
FlowPilot/
├── client/                 # Next.js 15 + TypeScript + Tailwind CSS (App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Landing page
│   │   │   ├── login/page.tsx     # Login page
│   │   │   ├── register/page.tsx  # Register page
│   │   │   ├── dashboard/page.tsx # Dashboard page
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── layout/             # Sidebar, Header, DashboardShell
│   │   │   └── ui/                 # Button, Input
│   │   ├── lib/api.ts               # Axios instance
│   │   ├── store/                   # Zustand stores
│   │   ├── schemas/                 # Zod validation schemas
│   │   └── types/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   ├── .eslintrc.json
│   └── .env.example
├── server/                 # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/          # env, cors, jwt config structure
│   │   ├── controllers/     # health, auth (stubbed)
│   │   ├── middleware/      # error handling, rate limiting, auth structure
│   │   ├── routes/          # health, auth, API base router
│   │   ├── types/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── docs/
│   └── architecture.md
├── docker-compose.yml       # placeholder only
├── .gitignore
├── .env.example
├── package.json             # root scripts
└── README.md
```

## Prerequisites

- Node.js >= 18.18
- npm >= 9

## Setup

Clone/download the project, then from the repo root:

```bash
# 1. Install dependencies for root, client, and server
npm run install:all

# 2. Copy environment files
cp .env.example .env
cp client/.env.example client/.env.local
cp server/.env.example server/.env

# 3. Edit the copied .env files with real values (JWT secrets, etc.)
```

If you'd rather install manually:

```bash
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

## Running the app

Run both apps together from the root:

```bash
npm run dev
```

This runs the client (http://localhost:3000) and server
(http://localhost:5000) concurrently, with labeled/colored output.

Or run them separately:

```bash
npm run dev:client   # Next.js dev server on :3000
npm run dev:server   # Express API on :5000 (ts-node-dev, auto-restarts)
```

## Building for production

```bash
npm run build           # builds both client and server
npm run build:client    # next build
npm run build:server    # tsc compile to server/dist

npm run start:client    # next start
npm run start:server    # node server/dist/server.js
```

## API

The server exposes:

- `GET /api` — API info / index
- `GET /api/health` — health check
- `POST /api/auth/register` — stubbed (501, not implemented yet)
- `POST /api/auth/login` — stubbed (501, not implemented yet)
- `POST /api/auth/logout` — stubbed (501, not implemented yet)
- `GET /api/auth/me` — stubbed (501, not implemented yet)

All `/api` routes are behind `helmet`, `cors` (scoped to `CLIENT_ORIGIN`),
`morgan` request logging, and `express-rate-limit`.

## What's intentionally NOT included yet

Per this phase's scope, the following are **not** implemented (only
placeholders/structure exist where noted):

- PostgreSQL / any database
- Prisma (or any ORM)
- Redis
- A working Docker setup (`docker-compose.yml` is a placeholder)
- Real authentication (JWT config structure and route stubs exist, but no
  password hashing, token issuance, or session logic)

## Tech stack

**Client:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Axios,
Zustand, React Hook Form, Zod, ESLint

**Server:** Express.js, TypeScript, ts-node-dev, dotenv, cors, helmet,
morgan, express-rate-limit, cookie-parser, jsonwebtoken (config only)
