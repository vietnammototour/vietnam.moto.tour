# Logging & Monitoring Layer — Design

**Date:** 2026-05-31
**Status:** Approved (pending spec review)

## Goal

Add a logging/monitoring layer so the operator can observe server activity from
inside the admin panel. Capture admin audit trail, API errors/exceptions, auth
events, and request traffic. Surface the high-value events in a new `/admin/logs`
page.

## Constraints

- **Zero budget** — no paid services, no new infra on the VPS.
- **Small, swap-limited VPS** (pm2, single Postgres) — no RAM-heavy stacks
  (Loki/Grafana ruled out).
- **In-app admin page** — logs must be queryable from Next.js, not a link-out.
- **Modern + future-proof** — structured logging, OTel/SaaS-ready later with no
  rewrite.

## Strategy: Hybrid

Separate "logging library" from "log storage":

- **pino** (approved new dependency) is the structured-logging foundation. Every
  event becomes JSON.
- High-value events (AUDIT / AUTH / ERROR) are **also persisted to a Postgres
  `LogEntry` row** → feeds the admin page. Low volume, high value.
- **Request traffic** → pino stdout only → **pm2 captures to disk**. Not stored in
  Postgres (avoids DB bloat on the small VPS).
- **Escape hatch:** because logs are structured pino JSON, stdout can later be
  shipped to Axiom / Grafana Cloud free tier or exported via OpenTelemetry with
  zero rewrite. No lock-in committed now.

## Architecture

```
emit          →  capture          →  store              →  view
logger.ts        withApiHandler()     Postgres LogEntry     /admin/logs page
(pino)           NextAuth events      pm2 stdout files      (filter/drawer/refresh)
                                       cron prune
```

## Data model — `LogEntry` (Prisma)

```prisma
enum LogType  { AUDIT  AUTH  ERROR }
enum LogLevel { INFO   WARN  ERROR }

model LogEntry {
  id         String   @id @default(cuid())
  createdAt  DateTime @default(now()) @db.Timestamptz
  type       LogType
  level      LogLevel @default(INFO)
  message    String
  userId     String?            // actor (nullable: anon/system)
  userEmail  String?            // snapshot, survives user deletion
  method     String?            // GET/POST/...
  path       String?            // /api/admin/tours/123
  statusCode Int?
  resource   String?            // "tour" (derived from path)
  resourceId String?            // "123"
  durationMs Int?
  ip         String?
  meta       Json?              // body snapshot / stack trace / request meta

  @@index([createdAt])
  @@index([type, createdAt])
  @@index([userId])
}
```

- `userId` is **not** a hard FK relation — it stores the actor id, and `userEmail`
  snapshots the identity so log history survives user deletion.
- New migration via `pnpm db:migrate`.

## Capture — `withApiHandler()` (`src/lib/api-handler.ts`)

Wrapper around each API handler. Signature roughly:

```ts
type ApiHandlerOpts = { requireAdmin?: boolean };
function withApiHandler(handler: NextApiHandler, opts?: ApiHandlerOpts): NextApiHandler
```

Behavior, in order:

1. Start a timer.
2. If `opts.requireAdmin`, run `requireAdmin(req, res)`. On 401/403, write an
   **AUTH** entry (`message: "access denied"`, `statusCode`, `path`, actor if any)
   and return.
3. `try { await handler(req, res) }`. On throw: write an **ERROR** entry
   (`level: ERROR`, message + stack in `meta`), `pino.error(...)`, and respond
   `500 { error: 'Internal server error' }` (never leak stack to client).
4. After a successful mutation method (POST/PUT/PATCH/DELETE) on an `/api/admin/*`
   path: write an **AUDIT** entry. `resource` and `resourceId` are parsed from the
   RESTful path (`/api/admin/{resource}/{id}`). A **scrubbed** request-body
   snapshot is stored in `meta`.
5. Always: `pino.info(...)` a request line (method, path, status, durationMs) to
   stdout → pm2 captures to disk.

### Audit honesty / known limitation

The wrapper records **what was requested** (method, resource, id, scrubbed body
snapshot) — **not** a true before/after diff. A generic wrapper cannot know each
domain's prior state. True before/after diffs can be layered onto specific
handlers later by emitting `logAudit({ before, after })` manually. This is an
accepted limitation of v1.

### Auth events

Login success, login failure, and signout are logged as **AUTH** entries via
NextAuth `events` callbacks in `src/lib/auth.ts` (`signIn`, `signOut`, and the
`signIn` callback returning false / `CredentialsSignin` error path).

## Security

- Before persisting `meta` / body snapshots, **scrub** sensitive keys:
  `password`, `token`, `secret`, `authorization`, `apiKey`, `accessToken`,
  `refreshToken` (case-insensitive, recursive). Never store credentials.
- Error responses to the client are generic (`Internal server error`); stack
  traces live only in `meta` server-side.
- The `/admin/logs` page and its API are admin-gated via `requireAdmin`.

## Logger module — `src/lib/logger.ts`

Exports:

- `logger` — configured pino instance (JSON to stdout; pretty in dev optional).
- `logAudit(entry)`, `logAuth(entry)`, `logError(entry)` — helpers that both
  `pino.*` and `writeLogEntry(...)` to Postgres.
- `writeLogEntry(data)` — maps to `prisma.logEntry.create`, applies scrubber.
- `scrub(obj)` — recursive secret redaction.

Writes are **fire-and-forget with a catch** — a logging failure must never break
the request it is logging (swallow + `pino.error` the logging failure itself).

## Viewer — `/admin/logs`

- Built on `AdminPageShell` + the existing DataGrid list pattern.
- **Filters** (server-side, paginated): type, level, actor user, date range.
- **Detail drawer**: row click opens a drawer showing all fields + full `meta`
  (before/after or body snapshot for audits, stack trace for errors, request meta).
- **Auto-refresh**: React Query `refetchInterval` (~10s) while the page is open,
  with a toggle to pause.
- **No full-text search** in v1 (kept out to limit query cost).
- **Nav**: add `{ href: '/admin/logs', label: 'Logs', icon: 'fa-clipboard-list' }`
  under the **System** group in `AdminLayout.nav.ts`.

### Data access — `src/data/queries/logs.ts`

- `getLogs(filters, pagination)` → `{ rows, total }`. Builds a Prisma `where` from
  type/level/userId/date-range; orders by `createdAt desc`; `take`/`skip`.
- Returns a mapped DTO (Date → ISO string) — never raw Prisma rows
  (CLAUDE.md serialization rule).

### API — `src/pages/api/admin/logs/index.ts`

- `GET` only (filtered, paginated). Wrapped with `withApiHandler({ requireAdmin: true })`.

### Routes registry

- `routes.admin.logs.list` in `src/routes/registry.ts`.
- `api.admin.logs.list(params)` in `src/routes/api.ts` returning `{data, error}`.

## Retention — cron prune

- `scripts/prune-logs.ts`: delete `AUTH`/`AUDIT` older than **90 days**, `ERROR`
  older than **30 days**.
- Run via **system crontab on the VPS** (daily). Documented in `.claude/VPS.md`.
- Cron install is a **manual VPS step** — `deploy.yml` is not modified.

## Files touched

| File | Change |
|---|---|
| `prisma/schema.prisma` | + `LogEntry`, `LogType`, `LogLevel`; migration |
| `src/lib/logger.ts` | pino instance + `logAudit/logAuth/logError` + `writeLogEntry` + `scrub` |
| `src/lib/api-handler.ts` | `withApiHandler()` wrapper |
| `src/lib/auth.ts` | NextAuth `events` → AUTH logs |
| `src/data/queries/logs.ts` | `getLogs(filters, pagination)` |
| `src/pages/api/admin/logs/index.ts` | `GET` (filtered) |
| `src/pages/admin/logs/index.tsx` + drawer/filter components | viewer page |
| `src/components/Admin/AdminLayout/AdminLayout.nav.ts` | nav item |
| `src/routes/registry.ts`, `src/routes/api.ts` | route + api wrapper |
| `scripts/prune-logs.ts` | prune job |
| `.claude/VPS.md` | document cron install |
| `package.json` | + `pino` dependency (approved) |

Admin API handlers migrate to `withApiHandler` **incrementally** — start with
tours, users, roles; the rest follow. The logging layer works for any wrapped
route; unwrapped routes simply aren't captured yet.

## Testing

- **`logger`**: field mapping correct; `scrub` redacts all listed secret keys
  recursively; write failure is swallowed (does not throw).
- **`withApiHandler`**: thrown error → ERROR entry + `500`; successful mutation →
  AUDIT entry with scrubbed body; auth denial → AUTH entry; `requireAdmin: false`
  routes skip the auth gate. Prisma mocked.
- **`queries/logs`**: filter `where` built correctly from each filter; prune
  cutoffs correct; DTO maps Date → string.
- **viewer page**: renders rows, changing a filter triggers refetch, row click
  opens the drawer. **Behavior/content/structure only — no styling assertions**
  (CLAUDE.md testing rule).

## Out of scope (v1)

- True before/after audit diffs for every handler (layered on later, per-handler).
- Full-text log search.
- Shipping logs to an external SaaS / OTel export (escape hatch designed in, not
  built).
- Storing request traffic in Postgres (stays in pm2 files).
