# Data Import & Processing Platform

A multi-user platform for importing large CSV/JSON datasets into project
workspaces. Files are validated, transformed, deduplicated and inserted
asynchronously by horizontally scalable workers, with processing progress
visible in a dashboard.


## Tech stack

| Layer          | Technology                     |
| -------------- | ------------------------------ |
| Backend        | Node.js, Express 5, TypeScript |
| Database       | PostgreSQL 16, Prisma          |
| Queue          | RabbitMQ          |
| Cache / stats  | Redis               |
| Object storage | MinIO              |
| Frontend       | React, Tailwind   |
| Infrastructure | Docker Compose                 |

## Prerequisites

- Node.js 22 (see `.nvmrc`)
- Docker Desktop

## Getting started

1. Install dependencies:

   ```bash
   npm install
   npm --prefix backend install
   ```

2. Create the environment file and fill in the values (see
   [Environment variables](#environment-variables)):

   ```bash
   cp backend/.env.example backend/.env
   ```

3. Start PostgreSQL and wait for it to report `(healthy)`:

   ```bash
   docker compose up -d
   docker compose ps
   ```

4. Generate the Prisma client and start the API:

   ```bash
   npm --prefix backend exec prisma generate
   npm --prefix backend run dev:api
   ```

5. Check it's running:

   ```bash
   curl http://localhost:4000/health
   ```

   A healthy response includes `"database": "up"`.

## Environment variables

All configuration lives in `backend/.env`. Docker Compose reads the same file
(via `env_file`) to configure the Postgres container.

| Variable            | Description                                        | Example            |
| ------------------- | -------------------------------------------------- | ------------------ |
| `NODE_ENV`          | `development`, `test` or `production`              | `development`      |
| `PORT`              | Port the API listens on                            | `4000`             |
| `LOG_LEVEL`         | pino log level                                     | `info`             |
| `POSTGRES_USER`     | Database user created on the container's first run | `appuser`          |
| `POSTGRES_PASSWORD` | Password for that user                             | `devpassword`      |
| `POSTGRES_DB`       | Database created on the container's first run      | `dataimport`       |
| `POSTGRES_PORT`     | Host port for Postgres (must match Compose)        | `5432`             |
| `DATABASE_URL`      | Connection string used by the API and Prisma       | see `.env.example` |

`DATABASE_URL` can reference the other variables, for example
`postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public`.

The `POSTGRES_*` values are only applied the first time the database volume is
created. To change them later, reset the volume with `docker compose down -v`
(this deletes all local data).

## Scripts

Run from `backend/`, or from the root with `npm --prefix backend run <script>`.

| Script      | What it does                  |
| ----------- | ----------------------------- |
| `dev:api`   | Start the API with hot reload |
| `build`     | Compile TypeScript to `dist/` |
| `start:api` | Run the compiled API          |
| `typecheck` | Type-check without emitting   |
| `lint`      | Run ESLint                    |
| `format`    | Format with Prettier          |

Git hooks (Husky) run ESLint and Prettier on staged files before each commit,
and a full type-check before each push.

## Project structure

```
.
├── backend/
│   ├── prisma/            # Prisma schema and migrations
│   └── src/
│       ├── api/           # Express app, routes, controllers, middlewares
│       ├── config/        # Environment validation
│       ├── errors/        # Error hierarchy
│       ├── utils/         # Logger, response helpers
│       └── container.ts   # Dependency wiring
├── docker-compose.yml
└── package.json           # Repo-level tooling (Husky, Prettier)
```

## Roadmap

- [x] API skeleton, error handling, structured logging
- [x] PostgreSQL via Docker Compose, Prisma wiring
- [ ] Authentication (JWT access tokens, rotating refresh tokens)
- [ ] Users, projects and role-based membership
- [ ] File upload to MinIO with presigned URLs
- [ ] RabbitMQ workers: validate, transform, deduplicate, batch insert
- [ ] Live progress over SSE, retries and dead-letter queue
- [ ] Dashboard and admin metrics
- [ ] React frontend
