# CLAUDE.md

Context for Claude Code working in this repository. Read this before making
changes — it records decisions already made in planning conversations so they
don't get re-litigated or silently reversed.

## What this project is

A work assignment: a multi-user **Data Import & Processing Platform**. Users
upload large CSV/JSON files into project workspaces; files are validated,
transformed, deduplicated and inserted asynchronously by horizontally
scalable RabbitMQ workers; progress and results are visible in a dashboard.

The brief is reproduced in full in `docs/CONTEXT.md` (verbatim from the
person who assigned this — treat it as the source of truth) and expanded in
`docs/BRD.md` (AI-generated elaboration of that brief — useful for the state
machine diagram, the entity list, and the open-questions list; **not** an
independent requirements source, and not yet reviewed by the person who gave
the assignment). If the two ever disagree, CONTEXT.md wins.

This is also a learning project: first time building RabbitMQ workers,
Node.js streaming, and MinIO. See "Labs" below.

## The person building this

Senior full-stack engineer, strong on the MERN stack and React/TypeScript,
comfortable requesting backend concepts be explained in depth rather than
just told what to type — the goal is to understand the *why*, not just ship
working code. Building DevOps skills (Docker, Kubernetes, Terraform, AWS)
toward a service-based → product-based company move, so treat this repo as
an interview/portfolio artifact, not just an assignment to close out:
correctness matters, but so does the repo reading as senior-level work
(clean structure, proper CI, a DLQ that's actually inspectable, no shortcuts
that a reviewer would flag).

Time budget: **7 days backend, 5 days frontend.**

## Six decisions already made (do not silently deviate)

The brief's open questions were resolved as follows. If a future requirement
seems to conflict with one of these, flag it — don't just override silently.

| Question | Decision | Why |
|---|---|---|
| Import schemas: custom or in code? | **In code**, seeded into `import_schemas` (customers, products, transactions) | A schema builder UI is a separate module; out of scope for the time budget |
| Duplicates: skip / upsert / report? | **Skip + count**, via `ON CONFLICT DO NOTHING` on a unique index | One mechanism gives both dedup and retry idempotency |
| Live progress transport? | **SSE**, with polling fallback | One-way server→client, works over plain HTTP, no socket lifecycle |
| Retry: resume or restart? | **Restart from row 0**, idempotent inserts handle correctness. Checkpoint-resume is a stretch goal only | Byte-offset resume breaks the moment a row straddles a chunk boundary |
| Roles: system flag or per-project role? | **One global role**, `users.role` = `ADMIN` / `MANAGER` / `MEMBER`; `project_members` is membership only (no role). `ADMIN` bypasses membership and sees everything. Revised 2026-09-21 — replaced an earlier "`is_admin` flag + per-project role" design | Simpler model with one "admin" concept. Trade-off accepted: a user has the same role in every project. Registration always creates `MEMBER`; the first `ADMIN` comes from a Prisma seed script |
| Progress % basis? | **Bytes read ÷ file size**, not row count | Row count is unknown until the file is fully read; byte progress is exact and free. Counters (processed/successful/failed/duplicates) stay row-exact |

## Repository layout

```
.
├── backend/          # API + worker — ONE npm package, TWO entrypoints
│   ├── src/api/       # Express only: app, routes, controllers, middlewares
│   ├── src/worker/    # RabbitMQ only: consumer, processing pipeline
│   ├── src/services/  # business logic — shared by both entrypoints
│   ├── src/repositories/
│   ├── src/errors/
│   ├── src/utils/
│   ├── src/config/
│   ├── src/types/
│   ├── src/container.ts   # composition root — construct dependencies ONCE, here
│   └── Dockerfile         # one image, `command:` differs per compose service
├── frontend/          # React + Tailwind + TypeScript (from Day 8)
├── labs/              # throwaway spikes — never imported by backend/ or frontend/
├── docs/
│   ├── CONTEXT.md     # the assignment, verbatim — source of truth
│   └── BRD.md          # AI-generated elaboration — reference only, unconfirmed
├── .github/workflows/
├── .husky/
└── package.json        # tooling root ONLY — not an npm workspace
```

### Why one backend package with two entrypoints, not two packages

Considered splitting into separate `api` and `worker` packages for a
"microservices" feel. Decided against it for this timeline: the two
entrypoints share the Prisma client, migrations, import-schema definitions,
queue topology, Redis key conventions, and the config/logger/error setup.
Splitting them means solving that sharing problem (npm workspaces, a `shared`
package, or copy-paste) for no runtime benefit — they're already independent
processes, independently scalable via `docker compose up --scale worker=4`,
talking only through RabbitMQ. The boundary is enforced by lint, not by
package boundaries:

**Rule: `src/worker/**` must never import from `src/api/**` or `express`, and
`src/api/**` must never import from `src/worker/**`.** This is an active
ESLint `no-restricted-imports` rule in `backend/eslint.config.js` — it will
fail lint, not just look wrong. Verified working (test import of `express`
inside `src/worker` throws two lint errors).

If this project ever needs truly independent deploys of API and worker,
revisit then — the discipline above makes that a mechanical extraction, not
a rewrite.

### `backend/` and `frontend/` are independently deployable

No workspace, no shared root `node_modules`. Each folder has its own
`package.json` and lockfile and can be built and installed with zero
reference to anything above it. Do not introduce npm/pnpm workspaces without
discussing it first — it breaks this property and complicates the
Dockerfiles.

**This is a structural property, not a deployment plan.** The actual deploy
target is a single origin: Nginx serves the built React assets and proxies
`/api` to Express, all under one hostname (decided 2026-09-21). That choice
is driven by the refresh token living in an httpOnly cookie — a split
frontend/backend deploy across different registrable domains (Vercel +
Render) would make that cookie cross-site, requiring `SameSite=None; Secure`
and exposing it to third-party cookie blocking in Safari. Same-origin keeps
it `SameSite=Lax` and simple. Nginx lands on Day 8 with the frontend; until
then use Vite's dev proxy locally.

## Code conventions

### Response envelope

Every API response uses one shape, from `src/utils/create-response.ts`:

```ts
{ success: boolean, message: string, data: T | null, error: ApiErrorPayload | null }
```

Use `ok(message, data)` / `fail(message, error)` helpers, or `createResponse`
directly. Don't invent a different shape for a new endpoint.

### Errors

All thrown errors extend `BaseError` (`src/errors/base.error.ts`), which
carries `statusCode`, `details`, and `isOperational`. `isOperational: true`
means "an anticipated failure whose message is safe to show the client"
(bad input, not found, conflict). `isOperational: false` means "a bug" — its
message is hidden from the client in production. The **same flag** will
decide retry behaviour in the worker (an operational failure like a
malformed row doesn't get retried; an infra failure does) — keep that
symmetry when extending the hierarchy.

All errors are converted to HTTP responses in exactly one place:
`src/api/middlewares/error-handler.middleware.ts`. Don't catch-and-format
errors ad hoc in a controller — throw a `BaseError` subclass and let it
propagate to `next(error)`.

### Layering

`controller → service → repository`, barrel-exported and versioned:

```ts
export * as v1UserController from "./v1/user.controller";
```

- **Controllers** (`src/api/controllers/v1/`): parse `req`, call one service
  method, call `next(error)` on failure, shape the response. No business
  logic, no direct repository access.
- **Services** (`src/services/v1/`): business rules. Framework-agnostic — no
  `req`/`res`, so they're callable from the worker too. Depend on
  repositories via constructor injection, not `new Repo()` inline.
- **Repositories** (`src/repositories/v1/`): the only layer that talks to
  persistence. Currently in-memory placeholders (`Map`-backed) — replaced
  with Prisma calls on Day 1 without changing their public signatures.
- **`src/container.ts`** is the single composition root. Construct services
  and repositories there once; import `container` where needed. Don't
  construct a second instance of a repository/service elsewhere — once
  repositories hold a real DB client this matters for connection pooling.

### Validation

`zod` schemas passed through the `validate()` middleware
(`src/api/middlewares/validate.middleware.ts`), which replaces `req.body`
with the parsed/coerced result. For `query`/`params`, it can't overwrite the
getter (Express 5), so it attaches `req.validatedQuery` /
`req.validatedParams` instead.

Zod chains apply in order — `.trim().toLowerCase().email()`, not
`.email().trim().toLowerCase()`, or a padded/mixed-case but otherwise valid
email gets rejected. (Caught by smoke test once already — don't reintroduce.)

### Config

All env vars are declared once in `src/config/env.ts` behind a zod schema.
Missing/malformed config kills the process at boot with a readable error,
not a mystery failure deep in a request handler. Add new env vars here, not
via ad hoc `process.env.X` reads elsewhere.

### Testing

Vitest 4.1.11 (pinned; v5 was three weeks old when chosen). Tests sit next to
the code as `*.test.ts`. Shared test data lives in `src/testing/mockData/`
(`mockUser`, `mockRegisterInput`, `mockLoginInput`, …, imported via its
`index.ts`) — tests import it rather than declaring inline fixtures. Values a
test exists to check (`"not-an-email"`, `"a".repeat(25)`) stay inline in the
test. Fake builders (`buildUser`, `createFakeUserRepository`) live in
`src/testing/factories.ts`. All of `src/testing/` and the tests are excluded
from the build via `tsconfig.build.json`, but included in `typecheck`.
`vitest.config.ts` supplies all env vars, so tests never read a developer's
`.env`.

What gets unit tested, and how:
- **Schemas and utils** — directly, no fakes. `jwt.ts` expiry uses fake timers.
- **Services** — pass a fake repository to the constructor
  (`createFakeUserRepository()` + `asUserRepository()`). Real bcrypt and real
  JWT signing are kept, not faked.
- **Middlewares** — plain `req` / `res` / `next` objects. Anything importing
  `container` directly needs `vi.mock("…/container.js")` with `vi.hoisted`.
  Production-only behaviour is tested by mocking `config/env.js` in a
  separate `*.production.test.ts` file.
- **Not unit tested, deliberately:** controllers and routes (thin; will be
  covered by HTTP-level `supertest` tests against `createApp()`), and
  repositories (need a real Postgres — integration tests).

New features ship with their tests in the same commit.

### Constants

`src/constants/` holds values that are duplicated, are policy decisions, or
must stay in sync. Imported via its `index.ts` barrel.

- `message.constants.ts` — `AUTH_MESSAGES`, `USER_MESSAGES`,
  `VALIDATION_MESSAGES`, `COMMON_MESSAGES`. Client-facing strings are part of
  the API contract, and some pairs are deliberately identical
  (`AUTH_MESSAGES.INVALID_CREDENTIALS` for both unknown email and wrong
  password). Centralising stops those pairs drifting apart.
- `validation.constants.ts` — password/name/email lengths, pagination
  defaults and `MAX_PAGE_SIZE`.
- `security.constants.ts` — `BCRYPT_COST_FACTOR`, `REFRESH_TOKEN_BYTES`,
  `JWT_ALGORITHM`, `JWT_SECRET_MIN_LENGTH`, `MS_PER_DAY`.
- `route.constants.ts` — `API_V1_PREFIX`, `AUTH_ROUTE_PREFIX`,
  `REFRESH_TOKEN_COOKIE`. **The refresh cookie's `Path` is derived from
  `AUTH_ROUTE_PREFIX`**, the same constant `app.ts` mounts the router with —
  if those two ever diverge the browser silently stops sending the cookie.
- `role.constants.ts` — `ROLE_RANK` only. Role *names* come from Prisma's
  generated `Role` enum: write `Role.ADMIN`, never the string `"ADMIN"`.

Not everything becomes a constant: a string used once, where reading it in
place is clearer, stays inline. Values a test exists to check stay inline in
the test.

### Logging

`pino`, via `src/utils/logger.ts`. Structured fields (`requestId`, `err`,
etc.), not string concatenation. Every request gets a `requestId` (from
`x-request-id` header if present, else generated) — this same id should
eventually be threaded onto the RabbitMQ message so a job's logs are
traceable end-to-end from HTTP request → queue → worker.

## Tooling decisions

- **npm, not pnpm.** pnpm's advantages (content-addressable store, strict
  phantom-dependency catching) matter most in large multi-package monorepos
  — not the case here. `npm ci` is also the default assumption of every
  Dockerfile example and CI template, which matters more for a 12-day solo
  build than marginal disk savings.
- **Husky v9** (`npx husky init`, not the old `husky install` /
  `husky add` — those are deprecated and most blog posts describing them are
  stale). `prepare` script is already wired.
- **lint-staged config lives inside each sub-package** (`backend/.lintstagedrc.json`),
  not one root config with `backend/**` globs — this way ESLint resolves
  against the right `node_modules` automatically.
- **Pre-commit is fast, pre-push is slow.** `pre-commit` runs `lint-staged`
  (ESLint + Prettier on staged files only). Full `tsc --noEmit` runs on
  `pre-push`, not commit — a slow pre-commit hook gets bypassed with
  `--no-verify` within a week, so don't add build/test there.
- **ESLint 10 (flat config)**, `typescript-eslint`, `eslint-config-prettier`
  (turns off ESLint's stylistic rules — do not add `eslint-plugin-prettier`,
  which runs Prettier through ESLint and turns every formatting diff into a
  lint error).
- **CI**: `.github/workflows/backend.yml` runs lint + typecheck + build on
  every push/PR touching `backend/**`, path-filtered so a frontend-only push
  doesn't trigger it. Add the frontend equivalent on Day 8.

## Current state (update this section as work progresses)

*Note: this section previously claimed a backend scaffold, working vertical
slice, and CI were done. On 2026-09-18 the repo directory was found to
contain only this file and the brief — none of that existed. Rewritten below
to match actual repo state. If you're reading this in a future session,
trust the repo over this file's prose.*

**Done:**
- Backend skeleton: Express app (`src/api/app.ts`) with `/health`, a 404
  fallback routed through `NotFoundError`, request-id and error-handler
  middlewares, `BaseError` hierarchy (bad-request/not-found/conflict/
  internal), response envelope, pino logger, zod-validated `env.ts`.
  **No worker** — removed deliberately on 2026-09-20; it (and the ESLint
  api/worker import-boundary rules) come back when the queue work starts.
- Commit 1 infra: `docker-compose.yml` with a `postgres` service (named
  volume, `pg_isready` healthcheck, no `container_name` so it stays
  scalable), Prisma wired up, `DATABASE_URL` in `env.ts` with `dotenv`,
  single `PrismaClient` in `src/container.ts`, `/health` proven against a
  real `SELECT 1`.
- **Prisma is pinned to 6.19.3, deliberately.** Prisma's `latest` dist-tag
  currently resolves to `8.0.0-rc.15` (a release candidate) while
  `@prisma/client` resolves to stable 7.x — a plain `npm install prisma`
  produces a mismatched, pre-release toolchain. Prisma 7 also removed
  `url` from the datasource block in favour of driver adapters plus a
  `prisma.config.ts`. 6.19.3 keeps the conventional
  `url = env("DATABASE_URL")` that every tutorial matches. Do not run
  `npm audit fix --force` — it downgrades the CLI and re-breaks the pairing.
- Commit 2, registration: migration 1 (`users` with a `user_role` enum,
  default `MEMBER`), `POST /api/v1/auth/register`, restored
  `validate.middleware.ts`, bcrypt (cost 12) in `src/utils/password.ts`,
  `UserRepository` → `AuthService` → controller, all wired once in
  `container.ts`. Duplicate emails are caught by translating Prisma `P2002`
  into `ConflictError` in the repository — deliberately no pre-check query,
  the unique index is the real guarantee. Password limit is 72 **bytes**
  (bcrypt truncates), checked with `Buffer.byteLength`. Request schemas live
  in `src/api/schemas/v1/`; `toPublicUser` in `src/services/v1/user.mapper.ts`
  strips `passwordHash`.
- Commit 3, login: `POST /api/v1/auth/login`, `GET /api/v1/users/me`
  (pulled forward from commit 5 so `authenticate` has a real route to
  prove it), `UnauthorizedError` / `ForbiddenError`, `src/utils/jwt.ts`
  (HS256, verify pinned to `algorithms: ["HS256"]`, payload is `sub` only),
  `authenticate` middleware → `AuthService.authenticate`, which loads the
  user on every request so deactivation takes effect immediately.
  Unknown-email logins compare against a dummy bcrypt hash so they take the
  same time as wrong-password logins (both ~195ms — no enumeration via
  timing). Disabled accounts get 403, but only after the correct password.
  TTL is `JWT_ACCESS_TTL_SECONDS` (a number, not `"15m"`) — unambiguous and
  avoids `@types/jsonwebtoken`'s `StringValue` typing. `jsonwebtoken`
  pinned to 9.0.3.
- Commit 4, refresh tokens: migration 2 (`refresh_tokens`: family_id,
  sha256 `token_hash` unique, expires_at, revoked_at; indexes on family_id
  and user_id; cascade on user delete). `POST /auth/refresh`, `/logout`
  (cookie only — no access token needed, succeeds with no cookie),
  `/logout-all` (needs access token). Raw token only ever lives in the
  httpOnly `refresh_token` cookie (`SameSite=Lax`, `Path=/api/v1/auth`,
  `Secure` from `COOKIE_SECURE`, default true); DB stores only its hash.
  Each login = new family; refresh rotates within the family; presenting a
  revoked token revokes the whole family. `RefreshTokenRepository.rotate`
  does a conditional `updateMany … where revokedAt: null` inside a
  transaction so two simultaneous refreshes can't both succeed — the loser
  is treated as reuse. Expiry slides (fresh 7 days per refresh). Cookie
  helper lives in `src/api/utils/` (it imports Express — must not be in
  shared `src/utils/`). Verified end to end with curl, including replay.
  Known gaps: expired/revoked rows are never cleaned up (job for the worker
  later); "reuse detected" is logged for *any* revoked token, including
  ones revoked by a normal logout.
- Commit 5, profile: `PATCH /api/v1/users/me` (name and/or email; body
  schema strips anything else, so `role`/`isActive` can't be self-set; an
  empty result is a 400) and `PATCH /api/v1/users/me/password` (verifies the
  current password; wrong one is a **400 on `currentPassword`, not 401**, so
  the frontend doesn't mistake it for an expired session). The new password
  hash and revocation of every refresh-token family happen in **one Prisma
  nested write** (`UserRepository.updatePasswordAndRevokeSessions`), so
  they're atomic; the response also clears the refresh cookie. Password
  rules live once in `newPasswordSchema` (auth.schema.ts), shared by register
  and change-password. `UserRepository` maps Prisma P2002 → 409 and
  P2025 → 404 in one `toDomainError` helper. Known gap: an access token
  issued before a password change stays valid for up to its 15 minutes.
- Commit 6, admin user management: `GET /api/v1/users` (paginated),
  `GET /api/v1/users/:id`, `PATCH /api/v1/users/:id` (role, isActive) —
  all ADMIN-only via the new `requireRole(minimum)` middleware, which ranks
  `MEMBER=1 < MANAGER=2 < ADMIN=3`. Route order matters: `/me` is declared
  before `/:id`. Guards in `UserService.updateUser`: an admin can't demote or
  deactivate **themselves** (403), and the **last active admin** can't be
  demoted at all (the builder replaced the original last-active-admin check
  with a blanket rule on 2026-09-23, leaving
  `UserRepository.countActiveAdmins` unused). Deactivating a user
  also revokes their sessions in the same nested write. Role changes take
  effect on the user's *next request* with no re-login, because
  `authenticate` loads the role from the DB each time. Pagination convention
  (first use — keep it): `data = { items, page, limit, total, totalPages }`,
  `limit` capped at 100, rows + count read in one `$transaction`.
  First ADMIN comes from `src/seed/admin.seed.ts` (`npx prisma db seed`,
  wired via `package.json` → `prisma.seed`), reading optional
  `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`; re-running it promotes an
  existing user without touching their password. **No unit tests for this
  commit** — the builder chose to skip them; verified by curl instead.
- Commit 7, projects: migration 3 (`projects`; `project_members` with
  unique `(project_id, user_id)`, index on `user_id`, cascade delete from
  both parents). `POST /api/v1/projects` (MANAGER+), `GET /projects`,
  `GET /projects/:id`, `PATCH /projects/:id` and `DELETE /projects/:id`
  (both: MANAGER **who is a member**, or ADMIN — delete was ADMIN-only in
  the plan, widened on 2026-09-24 to match PATCH). Creating a project inserts the creator's
  membership in the same nested write, so a project can't exist with nobody
  able to reach it. `GET /projects` runs **two different queries** — ADMIN
  gets `list()`, everyone else `listForMember()` — rather than fetching all
  and filtering, so a non-member's project never leaves the database.
  New `requireProjectAccess` middleware: ADMIN short-circuits; everyone else
  needs a membership row or gets **403 "You are not a member of this
  project"**. It originally returned 404 to hide whether a project existed;
  changed on 2026-09-24 because this is an internal tool where colleagues
  knowing a project exists is harmless, and a clear message beats a
  misleading "not found". Consequence: a non-admin hitting an id that
  doesn't exist also gets 403 (admins get 404). Revisit if the platform ever
  serves mutually untrusting tenants. Middleware order on `/:id` routes is
  `authenticate → validate → requireProjectAccess → requireRole`, because
  the middleware reads `req.validatedParams`. It calls
  `projectService.isMember` (not the repository) to keep the API layer off
  the persistence layer. `description` is optional and currently cannot be
  cleared once set (no nullable update path). Projects have no `createdBy`
  column — control comes from role + membership, per the roles decision.
  **No unit tests for this commit** — verified by curl across four roles.
- Unit tests: 64 tests across schemas, utils, services and middlewares
  (see "Testing" above). Writing them caught two real bugs: the register
  schema's `.max(24)` carried a "128 characters" message, and the error
  handler sent `isOperational: false` `BaseError` messages to clients in
  production (e.g. an internal IP and DB username). Both fixed.
- **`dotenv` pinned to 17.4.2 and `dotenv-expand` to 13.0.0, exactly.**
  `dotenv-expand@1000.0.0` (its `latest` tag, legitimately published) added
  command substitution — it executes `$(...)` found in `.env` values via
  `child_process` at boot. `dotenv@18` bundles a `run` CLI using
  `child_process`. The pinned pair does plain `${VAR}` expansion only. Don't
  bump either without re-checking for process execution.
- Compose reads credentials from `backend/.env` via `env_file` — there is
  no root `.env`. Host port is fixed at `5432:5432`.
- `git init`, repo directory layout created per the tree above.
- `docs/CONTEXT.md` in place (moved from a differently-named file at repo
  root). `docs/BRD.md` does not exist yet — not authored.
- Root tooling: `package.json` (tooling root, not a workspace), Husky v9
  wired (`npx husky` via `prepare`), `.husky/pre-commit` (runs
  `backend`'s lint-staged — needs a frontend branch added on Day 8),
  `.husky/pre-push` (runs `backend`'s `tsc --noEmit`), Prettier config,
  `.editorconfig`, `.nvmrc` (pinned to Node 22 LTS — the builder's local
  Node is v24, so `nvm use` will switch versions locally), `.gitignore`.

**Not started:**
- Module 1's last 3 endpoints — commit 8, project members: list / add by
  email (404 if unregistered, 409 if already a member) / remove.
- `src/utils/password.test.ts` was written then dropped before commit — the
  bcrypt wrapper currently has no tests.
- Compose services for Redis, RabbitMQ, MinIO, api, worker, nginx — each
  added when the code that uses it lands, not before.
- `Dockerfile`, CI workflow (`.github/workflows/backend.yml`)
- RabbitMQ topology, worker pipeline, MinIO integration, Redis progress
- Frontend (not scaffolded yet)

## Labs

`labs/` holds standalone learning spikes (streams/memory, RabbitMQ
basics/retry/DLQ, MinIO presigned URLs, Postgres bulk insert, Redis
progress) — see `labs/README.md`. These are throwaway: never imported by
`backend/` or `frontend/`, run directly with `tsx labs/<name>/index.ts`. Do
each lab before building the corresponding piece of the real pipeline, per
the day-by-day plan below.

## Day-by-day plan (7 backend, 5 frontend)

1. Foundations — monorepo layout (done), Compose skeleton, Prisma migration
   1 (`users`, `projects`, `project_members`), real auth
2. Files/upload — MinIO presigned PUT/GET, preview endpoint, migration 2
   (`imports`, `import_schemas`)
3. Queue — RabbitMQ topology + retry/DLQ, worker skeleton, start/cancel
   endpoints
4. Pipeline — real worker: stream → validate → transform → batch insert
   → error CSV
5. Progress — Redis counters, stage tracking, SSE endpoint, cancellation
6. Failure handling — backoff, max attempts, DLQ, idempotency, structured
   logging, deliberate chaos testing (`docker kill` a worker mid-import)
7. Dashboard APIs, admin metrics, scale test, healthchecks, README
8. Frontend shell — auth, routing, API client
9. Projects/people — members, invites, roles, admin users page
10. Upload — dropzone, presigned PUT with real progress, preview, schema
    picker
11. Imports — history, details view, live progress, cancel/retry
12. Dashboards, polish, full `docker compose up --scale worker=4` smoke test

## Open items to flag, not resolve silently

- The six decisions above (schema-in-code, skip+count dedup, SSE, restart
  retry, global role model, byte-based progress) are the builder's calls, not
  confirmed by whoever assigned the work. If it matters for a demo or
  review, say so explicitly rather than presenting them as settled
  requirements.
- Repo name in git history/local folder may not match the eventual GitHub
  repo name — cosmetic, not worth fixing mid-build.
- **Forgot-password is deliberately deferred** (decided 2026-09-22). Not in
  the brief, and it needs email delivery the stack doesn't have (Mailpit in
  Compose for dev, SES/SendGrid for prod). If picked up later: a
  `password_reset_tokens` table (sha256 hash, 15–30 min expiry, single use),
  reuse `generateRefreshToken`/`hashRefreshToken`, identical response and
  timing whether or not the email exists (send the email via the worker),
  and reset password + mark token used + revoke all sessions in one
  transaction, like `updatePasswordAndRevokeSessions`.
