# Data Import & Processing Platform

A multi-user platform for importing large CSV files into project workspaces.
Files are uploaded straight to object storage, then validated, deduplicated and
inserted in the background by queue workers, with live progress in the browser.

## Features

**Users and access**

- Register, log in, log out (this device or all devices)
- Short-lived access token plus a rotating refresh token in an httpOnly cookie
- Three roles: `MEMBER`, `MANAGER`, `ADMIN`
- Profile page: change name, email and password
- Admin user management: list users, change roles, activate or deactivate

**Projects**

- Create, edit and delete projects (managers and admins)
- Add members by email and remove them
- Users only see the projects they belong to; admins see all

**Import schemas**

- Define the columns a file must have: name, type, required, unique
- Project schemas and global schemas (admin only)
- Schemas cannot be edited once created; they can be archived

**Imports**

- Upload a CSV (up to 2 GB) directly to object storage with a progress bar
- Background processing: file validation, schema validation, import, error report
- Duplicate rows are skipped and counted
- Automatic retries with backoff, a dead-letter queue, and manual retry
- Import history per project, with a status filter
- Import details with live progress, stage tracker, row counters and a sample
  of failed rows
- Cancel, download the original file, download the error report _(API ready; UI in progress)_
- User and admin dashboards _(API ready; UI in progress)_

## Architecture

The browser talks to one origin. Nginx serves the React build and forwards
`/api` to the backend. Files do not pass through the API: the browser uploads
them to object storage with a presigned URL.

```
                    ┌─ browser ─────────────────────────────┐
                    │  http://localhost:8080                │
                    └───────┬───────────────────────┬───────┘
                            │                       │
                  (a) app + /api             (c) presigned PUT
                            │                       │
                    ╔═══════▼═══════╗               │
                    ║  frontend     ║  :8080        │
                    ║  nginx + dist ║  CONTAINER    │
                    ╚═══════┬═══════╝               │
                            │ (b) proxy /api, /health
                            │ host.docker.internal:4000
                    ┌───────▼─────────────┐         │
                    │  API + worker       │         │
                    │  npm run dev:api    │ ← NOT a container
                    │  on your Mac, :4000 │         │
                    └───────┬─────────────┘         │
                            │ localhost:<published> │
   ╔════════════╗ ╔═════════▼═══╗ ╔══════════╗ ╔════▼═══════╗
   ║ postgres   ║ ║ redis       ║ ║ rabbitmq ║ ║ rustfs     ║
   ║ :5432      ║ ║ :6379       ║ ║ :5672    ║ ║ :9000/9001 ║
   ╚════════════╝ ╚═════════════╝ ╚══════════╝ ╚════════════╝
```

How an import flows:

1. The browser asks the API to prepare an upload and gets a presigned URL.
2. The browser `PUT`s the file straight to RustFS.
3. The browser tells the API to start; the API checks the stored file and
   publishes a job to RabbitMQ.
4. A worker streams the file, validates each row against the schema, and
   inserts rows in batches into PostgreSQL. Duplicates are skipped by a unique
   index.
5. The worker writes progress counters to Redis; the browser polls the API for
   them.
6. A failed job is retried with backoff; after 3 attempts it goes to the
   dead-letter queue.

| Piece          | Technology                                          |
| -------------- | --------------------------------------------------- |
| Backend        | Node.js 22, Express 5, TypeScript, Prisma           |
| Frontend       | React 18, Vite, TypeScript, MUI, Tailwind           |
| Database       | PostgreSQL 16                                       |
| Queue          | RabbitMQ 4                                          |
| Progress cache | Redis 8                                             |
| Object storage | RustFS (S3-compatible; the app uses the AWS S3 SDK) |
| Infrastructure | Docker Compose, Nginx                               |

## Commands to run

Prerequisites: Node.js 22 (see `.nvmrc`) and Docker Desktop.

**First-time setup**

```bash
npm install                        # repo root: installs the git hooks
npm --prefix backend install
npm --prefix frontend install
cp backend/.env.example backend/.env    # then fill in the values
```

**Start everything**

```bash
# 1. Infrastructure, plus the frontend container on http://localhost:8080
docker compose up -d

# 2. Database tables and the first admin user
npm --prefix backend exec prisma migrate deploy
npm --prefix backend exec prisma db seed

# 3. API on http://localhost:4000 (keep running)
npm --prefix backend run dev:api

# 4. Worker, in a second terminal (keep running)
npm --prefix backend run dev:worker
```

Open **http://localhost:8080** and sign in with the seeded admin
(`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `backend/.env`).

**Frontend with hot reload** (instead of the container):

```bash
npm --prefix frontend run dev      # http://localhost:5173
```

**Other useful commands**

| Command                                 | What it does                        |
| --------------------------------------- | ----------------------------------- |
| `npm --prefix backend test`             | Backend unit tests                  |
| `npm --prefix frontend test`            | Frontend unit tests                 |
| `npm --prefix backend run lint`         | Lint the backend                    |
| `npm --prefix frontend run lint`        | Lint the frontend                   |
| `npm --prefix backend run typecheck`    | Type-check the backend              |
| `npm --prefix frontend run typecheck`   | Type-check the frontend             |
| `npm --prefix backend run studio`       | Browse the database (Prisma Studio) |
| `docker compose up -d --build frontend` | Rebuild the frontend container      |
| `docker compose down`                   | Stop the containers (data is kept)  |
| `docker compose down -v`                | Stop and **delete all local data**  |

Consoles: RabbitMQ at http://localhost:15672, RustFS at
http://localhost:9001/rustfs/console.

## Backend structure

One package with two entry points: the API and the worker. They share the
services, repositories and configuration, and talk only through RabbitMQ.

```
backend/
├── prisma/                 # Database schema and migrations
└── src/
    ├── api/                # Express only
    │   ├── index.ts        #   API entry point
    │   ├── app.ts          #   App setup and route mounting
    │   ├── routes/         #   URL → middleware → controller
    │   ├── controllers/    #   Read the request, call a service, send the response
    │   ├── middlewares/    #   Auth, roles, validation, idempotency, errors
    │   └── schemas/        #   zod request schemas
    ├── worker/             # RabbitMQ only
    │   ├── index.ts        #   Worker entry point
    │   ├── consumer.ts     #   Takes jobs, handles retries and the dead-letter queue
    │   └── pipeline/       #   Stream → validate → batch insert → error report
    ├── queue/              # RabbitMQ connection, exchanges/queues, publisher
    ├── services/           # Business rules (used by both API and worker)
    ├── repositories/       # The only layer that talks to the database
    ├── errors/             # Error classes
    ├── constants/          # Messages, limits, queue and storage settings
    ├── config/             # Environment variables, validated at startup
    ├── utils/              # Logger, JWT, passwords, response helpers
    ├── seed/               # Creates the first admin user
    ├── testing/            # Test data and fakes
    └── container.ts        # Builds and wires every dependency, once
```

A request goes `route → controller → service → repository`.

## Frontend structure

```
frontend/
├── Dockerfile              # Builds the app and serves it with Nginx
├── nginx/                  # Nginx config: static files, SPA fallback, /api proxy
└── src/
    ├── main.tsx            # Entry point
    ├── App.tsx             # Routes and route guards
    ├── pages/              # One component per screen
    ├── components/
    │   ├── common/         #   Shared: DataTable, Input, dialogs, loader
    │   ├── auth/           #   Login and register forms, route guards
    │   ├── user/           #   Profile, users table
    │   ├── project/        #   Project cards, forms, members
    │   ├── schema/         #   Schema list and field builder
    │   └── import/         #   Upload dialog, history, progress
    ├── service/            # API calls as React Query hooks
    ├── store/              # Redux: session and notifications
    ├── hooks/              # Shared hooks
    ├── validations/        # zod form schemas
    ├── constants/          # All user-facing text, routes, API paths, limits
    ├── types/              # All TypeScript types
    ├── utils/              # API client, formatting, helpers
    └── testing/            # Test setup and test data
```

Server data lives in React Query; Redux only holds the session and UI state.
User-facing text is never written inline in components; it comes from
`constants/`.
