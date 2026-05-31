# Logging & Monitoring Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture admin audit, API errors, auth events, and request traffic; persist high-value events to Postgres and surface them in a new `/admin/logs` page.

**Architecture:** A `pino` structured logger emits JSON to stdout (pm2 captures request traffic). AUDIT/AUTH/ERROR events are also persisted to a Postgres `LogEntry` table via a `withApiHandler()` wrapper and NextAuth `events`. A new admin page lists/filters them with a detail drawer and auto-refresh. A cron script prunes old rows.

**Tech Stack:** Next.js 16 (Pages Router), Prisma + Postgres, NextAuth v4, pino, React Query, Jest + RTL, `node-mocks-http`.

**Spec:** `docs/superpowers/specs/2026-05-31-logging-monitoring-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `prisma/schema.prisma` | `LogEntry` model + `LogType`/`LogLevel` enums |
| `src/domain/log/types.ts` | `LogEntryDTO`, `LogType`, `LogLevel`, filter types |
| `src/domain/log/mapper.ts` | Prisma row → `LogEntryDTO` (Date→ISO) |
| `src/lib/logger.ts` | pino instance, `scrub`, `writeLogEntry`, `logAudit/logAuth/logError` |
| `src/lib/api-handler.ts` | `withApiHandler()` wrapper |
| `src/lib/auth.ts` | NextAuth `events` → AUTH logs (modify) |
| `src/data/queries/logs.ts` | `getLogs(filters, page)`, `pruneLogs()` |
| `src/pages/api/admin/logs/index.ts` | GET (filtered, paginated) |
| `src/pages/admin/logs/index.tsx` | Viewer page |
| `src/components/Admin/Logs/LogFilters.tsx` | Filter bar |
| `src/components/Admin/Logs/LogDetailDrawer.tsx` | Detail drawer |
| `src/components/Admin/AdminLayout/AdminLayout.nav.ts` | Nav item (modify) |
| `src/routes/registry.ts`, `src/routes/api.ts` | Route + api client (modify) |
| `scripts/prune-logs.ts` | Cron prune job |
| `.claude/VPS.md` | Document cron install (modify) |

---

## Task 1: Install pino

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install pino (approved dependency)**

Run: `pnpm add pino`
Expected: `pino` appears in `package.json` dependencies; lockfile updated.

- [ ] **Step 2: Verify it resolves**

Run: `pnpm exec node -e "require('pino')()"`
Expected: no error (exit 0).

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "build: add pino logging dependency"
```

---

## Task 2: Prisma LogEntry model + migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add enums + model**

Append to `prisma/schema.prisma`:

```prisma
enum LogType {
  AUDIT
  AUTH
  ERROR
}

enum LogLevel {
  INFO
  WARN
  ERROR
}

model LogEntry {
  id         String   @id @default(cuid())
  createdAt  DateTime @default(now()) @db.Timestamptz
  type       LogType
  level      LogLevel @default(INFO)
  message    String
  userId     String?
  userEmail  String?
  method     String?
  path       String?
  statusCode Int?
  resource   String?
  resourceId String?
  durationMs Int?
  ip         String?
  meta       Json?

  @@index([createdAt])
  @@index([type, createdAt])
  @@index([userId])
}
```

- [ ] **Step 2: Create the migration**

Run: `pnpm db:migrate --name add_log_entry`
Expected: new folder under `prisma/migrations/`, client regenerated, `prisma.logEntry` available.

- [ ] **Step 3: Verify client type**

Run: `pnpm typecheck`
Expected: PASS (no errors from referencing `LogEntry`).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add LogEntry model and enums"
```

---

## Task 3: Log domain types + mapper

**Files:**
- Create: `src/domain/log/types.ts`
- Create: `src/domain/log/mapper.ts`
- Test: `src/domain/log/mapper.spec.ts`

- [ ] **Step 1: Write the failing test**

`src/domain/log/mapper.spec.ts`:

```typescript
import {toLogEntry} from './mapper';

describe('toLogEntry', () => {
  it('maps a prisma row to a DTO with ISO date', () => {
    const row = {
      id: 'l1',
      createdAt: new Date('2026-05-31T10:00:00.000Z'),
      type: 'AUDIT',
      level: 'INFO',
      message: 'created tour',
      userId: 'u1',
      userEmail: 'a@b.com',
      method: 'POST',
      path: '/api/admin/tours',
      statusCode: 201,
      resource: 'tours',
      resourceId: null,
      durationMs: 42,
      ip: '1.2.3.4',
      meta: {requestBody: {slug: 'x'}},
    };
    expect(toLogEntry(row as never)).toEqual({
      id: 'l1',
      createdAt: '2026-05-31T10:00:00.000Z',
      type: 'AUDIT',
      level: 'INFO',
      message: 'created tour',
      userId: 'u1',
      userEmail: 'a@b.com',
      method: 'POST',
      path: '/api/admin/tours',
      statusCode: 201,
      resource: 'tours',
      resourceId: null,
      durationMs: 42,
      ip: '1.2.3.4',
      meta: {requestBody: {slug: 'x'}},
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/domain/log/mapper.spec.ts`
Expected: FAIL — cannot find module `./mapper`.

- [ ] **Step 3: Write types**

`src/domain/log/types.ts`:

```typescript
export type LogType = 'AUDIT' | 'AUTH' | 'ERROR';
export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export type LogEntryDTO = {
  id: string;
  createdAt: string;
  type: LogType;
  level: LogLevel;
  message: string;
  userId: string | null;
  userEmail: string | null;
  method: string | null;
  path: string | null;
  statusCode: number | null;
  resource: string | null;
  resourceId: string | null;
  durationMs: number | null;
  ip: string | null;
  meta: unknown;
};

export type LogFilters = {
  type?: LogType;
  level?: LogLevel;
  userId?: string;
  from?: string; // ISO date
  to?: string; // ISO date
};
```

- [ ] **Step 4: Write mapper**

`src/domain/log/mapper.ts`:

```typescript
import type {LogEntryDTO, LogLevel, LogType} from './types';

type LogRow = {
  id: string;
  createdAt: Date;
  type: string;
  level: string;
  message: string;
  userId: string | null;
  userEmail: string | null;
  method: string | null;
  path: string | null;
  statusCode: number | null;
  resource: string | null;
  resourceId: string | null;
  durationMs: number | null;
  ip: string | null;
  meta: unknown;
};

export function toLogEntry(row: LogRow): LogEntryDTO {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    type: row.type as LogType,
    level: row.level as LogLevel,
    message: row.message,
    userId: row.userId,
    userEmail: row.userEmail,
    method: row.method,
    path: row.path,
    statusCode: row.statusCode,
    resource: row.resource,
    resourceId: row.resourceId,
    durationMs: row.durationMs,
    ip: row.ip,
    meta: row.meta,
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test src/domain/log/mapper.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/log
git commit -m "feat(log): add log domain types and mapper"
```

---

## Task 4: Logger module — scrub + writeLogEntry + helpers

**Files:**
- Create: `src/lib/logger.ts`
- Test: `src/lib/logger.spec.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/logger.spec.ts`:

```typescript
import {scrub, writeLogEntry} from './logger';
import {prisma} from './prisma';

jest.mock('./prisma', () => ({
  prisma: {logEntry: {create: jest.fn()}},
}));

describe('scrub', () => {
  it('redacts sensitive keys recursively', () => {
    const input = {
      slug: 'tour-x',
      password: 'hunter2',
      nested: {token: 'abc', keep: 1},
      Authorization: 'Bearer z',
    };
    expect(scrub(input)).toEqual({
      slug: 'tour-x',
      password: '[REDACTED]',
      nested: {token: '[REDACTED]', keep: 1},
      Authorization: '[REDACTED]',
    });
  });

  it('passes through non-objects', () => {
    expect(scrub('x')).toBe('x');
    expect(scrub(null)).toBe(null);
  });
});

describe('writeLogEntry', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a row with scrubbed meta', async () => {
    (prisma.logEntry.create as jest.Mock).mockResolvedValue({});
    await writeLogEntry({
      type: 'AUDIT',
      message: 'created',
      meta: {password: 'p'},
    });
    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'AUDIT',
        level: 'INFO',
        message: 'created',
        meta: {password: '[REDACTED]'},
      }),
    });
  });

  it('never throws when the DB write fails', async () => {
    (prisma.logEntry.create as jest.Mock).mockRejectedValue(new Error('db down'));
    await expect(
      writeLogEntry({type: 'ERROR', message: 'x'}),
    ).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/lib/logger.spec.ts`
Expected: FAIL — cannot find module `./logger`.

- [ ] **Step 3: Write the logger**

`src/lib/logger.ts`:

```typescript
import pino from 'pino';
import {prisma} from './prisma';
import type {LogLevel, LogType} from '@/domain/log/types';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: undefined,
});

const SECRET_KEYS = [
  'password',
  'token',
  'secret',
  'authorization',
  'apikey',
  'accesstoken',
  'refreshtoken',
];

export function scrub(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(scrub);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SECRET_KEYS.includes(k.toLowerCase()) ? '[REDACTED]' : scrub(v);
  }
  return out;
}

export type WriteLogInput = {
  type: LogType;
  level?: LogLevel;
  message: string;
  userId?: string | null;
  userEmail?: string | null;
  method?: string | null;
  path?: string | null;
  statusCode?: number | null;
  resource?: string | null;
  resourceId?: string | null;
  durationMs?: number | null;
  ip?: string | null;
  meta?: unknown;
};

export async function writeLogEntry(input: WriteLogInput): Promise<void> {
  try {
    await prisma.logEntry.create({
      data: {
        type: input.type,
        level: input.level ?? 'INFO',
        message: input.message,
        userId: input.userId ?? null,
        userEmail: input.userEmail ?? null,
        method: input.method ?? null,
        path: input.path ?? null,
        statusCode: input.statusCode ?? null,
        resource: input.resource ?? null,
        resourceId: input.resourceId ?? null,
        durationMs: input.durationMs ?? null,
        ip: input.ip ?? null,
        meta: input.meta === undefined ? undefined : (scrub(input.meta) as never),
      },
    });
  } catch (err) {
    // A logging failure must never break the request being logged.
    logger.error({err}, 'writeLogEntry failed');
  }
}

export async function logAudit(input: Omit<WriteLogInput, 'type'>): Promise<void> {
  logger.info({...input, type: 'AUDIT'}, input.message);
  await writeLogEntry({...input, type: 'AUDIT'});
}

export async function logAuth(input: Omit<WriteLogInput, 'type'>): Promise<void> {
  logger.info({...input, type: 'AUTH'}, input.message);
  await writeLogEntry({...input, type: 'AUTH'});
}

export async function logError(input: Omit<WriteLogInput, 'type'>): Promise<void> {
  logger.error({...input, type: 'ERROR'}, input.message);
  await writeLogEntry({level: 'ERROR', ...input, type: 'ERROR'});
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/lib/logger.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/logger.ts src/lib/logger.spec.ts
git commit -m "feat(log): add pino logger with scrub and writeLogEntry"
```

---

## Task 5: `withApiHandler()` wrapper

**Files:**
- Create: `src/lib/api-handler.ts`
- Test: `src/lib/api-handler.spec.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/api-handler.spec.ts`:

```typescript
import {createMocks} from 'node-mocks-http';
import {withApiHandler} from './api-handler';
import {requireAdmin} from './admin-auth';
import {logAudit, logAuth, logError} from './logger';
import {getServerSession} from 'next-auth/next';

jest.mock('./admin-auth', () => ({requireAdmin: jest.fn()}));
jest.mock('./logger', () => ({
  logAudit: jest.fn(),
  logAuth: jest.fn(),
  logError: jest.fn(),
  logger: {info: jest.fn(), error: jest.fn()},
}));
jest.mock('next-auth/next', () => ({getServerSession: jest.fn()}));

beforeEach(() => {
  jest.clearAllMocks();
  (getServerSession as jest.Mock).mockResolvedValue({
    user: {id: 'u1', email: 'a@b.com'},
  });
  (requireAdmin as jest.Mock).mockResolvedValue(true);
});

it('writes an ERROR log and returns 500 when the handler throws', async () => {
  const handler = withApiHandler(async () => {
    throw new Error('boom');
  });
  const {req, res} = createMocks({method: 'GET', url: '/api/admin/tours'});
  await handler(req as never, res as never);
  expect(res._getStatusCode()).toBe(500);
  expect(logError).toHaveBeenCalledWith(
    expect.objectContaining({message: 'boom', path: '/api/admin/tours'}),
  );
});

it('writes an AUDIT log after a successful mutation', async () => {
  const handler = withApiHandler(async (_req, res) => {
    res.status(201).json({ok: true});
  });
  const {req, res} = createMocks({
    method: 'POST',
    url: '/api/admin/tours/123',
    body: {slug: 'x', password: 'p'},
  });
  await handler(req as never, res as never);
  expect(logAudit).toHaveBeenCalledWith(
    expect.objectContaining({
      method: 'POST',
      resource: 'tours',
      resourceId: '123',
      userId: 'u1',
      meta: expect.objectContaining({requestBody: {slug: 'x', password: 'p'}}),
    }),
  );
});

it('does NOT audit a GET', async () => {
  const handler = withApiHandler(async (_req, res) => res.status(200).json([]));
  const {req, res} = createMocks({method: 'GET', url: '/api/admin/tours'});
  await handler(req as never, res as never);
  expect(logAudit).not.toHaveBeenCalled();
});

it('logs AUTH and stops when requireAdmin denies', async () => {
  (requireAdmin as jest.Mock).mockImplementation(async (_req, res) => {
    res.status(403).json({error: 'Forbidden'});
    return false;
  });
  const inner = jest.fn();
  const handler = withApiHandler(inner, {requireAdmin: true});
  const {req, res} = createMocks({method: 'POST', url: '/api/admin/tours'});
  await handler(req as never, res as never);
  expect(inner).not.toHaveBeenCalled();
  expect(logAuth).toHaveBeenCalledWith(
    expect.objectContaining({statusCode: 403, path: '/api/admin/tours'}),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/lib/api-handler.spec.ts`
Expected: FAIL — cannot find module `./api-handler`.

- [ ] **Step 3: Write the wrapper**

`src/lib/api-handler.ts`:

```typescript
import type {NextApiHandler, NextApiRequest, NextApiResponse} from 'next';
import {getServerSession} from 'next-auth/next';
import {authOptions} from './auth';
import {requireAdmin} from './admin-auth';
import {logAudit, logAuth, logError, logger} from './logger';

export type ApiHandlerOpts = {requireAdmin?: boolean};

const MUTATIONS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function parsePath(url: string | undefined): {
  path: string;
  resource: string | null;
  resourceId: string | null;
} {
  const path = (url ?? '').split('?')[0];
  const segments = path.split('/').filter(Boolean); // ['api','admin','tours','123']
  const adminIdx = segments.indexOf('admin');
  const rest = adminIdx >= 0 ? segments.slice(adminIdx + 1) : [];
  return {
    path,
    resource: rest[0] ?? null,
    resourceId: rest[1] ?? null,
  };
}

function clientIp(req: NextApiRequest): string | null {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  if (Array.isArray(fwd)) return fwd[0];
  return req.socket?.remoteAddress ?? null;
}

export function withApiHandler(
  handler: NextApiHandler,
  opts: ApiHandlerOpts = {},
): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const start = Date.now();
    const {path, resource, resourceId} = parsePath(req.url);
    const ip = clientIp(req);

    const session = await getServerSession(req, res, authOptions).catch(() => null);
    const userId = session?.user?.id ?? null;
    const userEmail = session?.user?.email ?? null;

    if (opts.requireAdmin) {
      const ok = await requireAdmin(req, res);
      if (!ok) {
        await logAuth({
          message: 'access denied',
          level: 'WARN',
          userId,
          userEmail,
          method: req.method ?? null,
          path,
          statusCode: res.statusCode,
          resource,
          resourceId,
          ip,
        });
        return;
      }
    }

    try {
      await handler(req, res);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const stack = err instanceof Error ? err.stack : undefined;
      await logError({
        message,
        userId,
        userEmail,
        method: req.method ?? null,
        path,
        statusCode: 500,
        resource,
        resourceId,
        durationMs: Date.now() - start,
        ip,
        meta: {stack},
      });
      if (!res.headersSent) {
        res.status(500).json({error: 'Internal server error'});
      }
      return;
    }

    const durationMs = Date.now() - start;
    logger.info(
      {method: req.method, path, statusCode: res.statusCode, durationMs},
      'request',
    );

    if (
      req.method &&
      MUTATIONS.has(req.method) &&
      res.statusCode < 400 &&
      path.startsWith('/api/admin/')
    ) {
      await logAudit({
        message: `${req.method} ${resource ?? path}`,
        userId,
        userEmail,
        method: req.method,
        path,
        statusCode: res.statusCode,
        resource,
        resourceId,
        durationMs,
        ip,
        meta: {requestBody: req.body ?? null},
      });
    }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/lib/api-handler.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/api-handler.ts src/lib/api-handler.spec.ts
git commit -m "feat(log): add withApiHandler wrapper for audit/error/auth capture"
```

---

## Task 6: NextAuth events → AUTH logs

**Files:**
- Modify: `src/lib/auth.ts`

- [ ] **Step 1: Read the current auth.ts to find the authOptions object**

Run: `pnpm exec grep -n "authOptions" src/lib/auth.ts`
Expected: locate `export const authOptions ... = { ... }`.

- [ ] **Step 2: Add an `events` block to `authOptions`**

Add this `events` property inside the `authOptions` object (alongside `callbacks`, `providers`). Place the import at the top of the file:

```typescript
import {logAuth} from './logger';
```

Inside `authOptions`:

```typescript
  events: {
    async signIn(message) {
      await logAuth({
        message: 'login success',
        userId: message.user?.id ?? null,
        userEmail: message.user?.email ?? null,
      });
    },
    async signOut(message) {
      await logAuth({
        message: 'logout',
        userId: (message.token?.sub as string) ?? null,
        userEmail: (message.token?.email as string) ?? null,
      });
    },
  },
```

> Note: NextAuth v4 `events` does not fire on failed credential logins. Failed-login capture is handled by the `withApiHandler` auth-denial path (Task 5) for admin API routes; credential failures surface as `CredentialsSignin` on the client. Logging failed credential attempts at the provider `authorize()` level is deferred to a follow-up (out of scope per spec).

- [ ] **Step 3: Verify types**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat(log): log login/logout AUTH events via NextAuth events"
```

---

## Task 7: Logs query module

**Files:**
- Create: `src/data/queries/logs.ts`
- Test: `src/data/queries/logs.spec.ts`

- [ ] **Step 1: Write the failing test**

`src/data/queries/logs.spec.ts`:

```typescript
import {getLogs, pruneLogs} from './logs';
import {prisma} from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    logEntry: {
      findMany: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

beforeEach(() => jest.clearAllMocks());

describe('getLogs', () => {
  it('builds a where clause from filters and returns mapped rows + total', async () => {
    (prisma.logEntry.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'l1',
        createdAt: new Date('2026-05-31T00:00:00.000Z'),
        type: 'ERROR',
        level: 'ERROR',
        message: 'boom',
        userId: null,
        userEmail: null,
        method: 'GET',
        path: '/api/admin/tours',
        statusCode: 500,
        resource: 'tours',
        resourceId: null,
        durationMs: 5,
        ip: null,
        meta: null,
      },
    ]);
    (prisma.logEntry.count as jest.Mock).mockResolvedValue(1);

    const result = await getLogs(
      {type: 'ERROR', from: '2026-05-01T00:00:00.000Z'},
      {page: 1, pageSize: 25},
    );

    expect(prisma.logEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          type: 'ERROR',
          createdAt: {gte: new Date('2026-05-01T00:00:00.000Z')},
        },
        orderBy: {createdAt: 'desc'},
        take: 25,
        skip: 0,
      }),
    );
    expect(result.total).toBe(1);
    expect(result.rows[0]).toEqual(
      expect.objectContaining({id: 'l1', createdAt: '2026-05-31T00:00:00.000Z'}),
    );
  });
});

describe('pruneLogs', () => {
  it('deletes AUTH/AUDIT older than 90d and ERROR older than 30d', async () => {
    (prisma.logEntry.deleteMany as jest.Mock).mockResolvedValue({count: 3});
    const now = new Date('2026-05-31T00:00:00.000Z');
    await pruneLogs(now);
    expect(prisma.logEntry.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            type: {in: ['AUTH', 'AUDIT']},
            createdAt: {lt: new Date('2026-03-02T00:00:00.000Z')},
          },
          {type: 'ERROR', createdAt: {lt: new Date('2026-05-01T00:00:00.000Z')}},
        ],
      },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/data/queries/logs.spec.ts`
Expected: FAIL — cannot find module `./logs`.

- [ ] **Step 3: Write the query module**

`src/data/queries/logs.ts`:

```typescript
import {prisma} from '@/lib/prisma';
import {toLogEntry} from '@/domain/log/mapper';
import type {LogEntryDTO, LogFilters} from '@/domain/log/types';

const DAY_MS = 24 * 60 * 60 * 1000;

export type LogPage = {page: number; pageSize: number};

function buildWhere(filters: LogFilters) {
  const where: Record<string, unknown> = {};
  if (filters.type) where.type = filters.type;
  if (filters.level) where.level = filters.level;
  if (filters.userId) where.userId = filters.userId;
  if (filters.from || filters.to) {
    const range: Record<string, Date> = {};
    if (filters.from) range.gte = new Date(filters.from);
    if (filters.to) range.lte = new Date(filters.to);
    where.createdAt = range;
  }
  return where;
}

export async function getLogs(
  filters: LogFilters,
  page: LogPage,
): Promise<{rows: LogEntryDTO[]; total: number}> {
  const where = buildWhere(filters);
  const [rows, total] = await Promise.all([
    prisma.logEntry.findMany({
      where,
      orderBy: {createdAt: 'desc'},
      take: page.pageSize,
      skip: (page.page - 1) * page.pageSize,
    }),
    prisma.logEntry.count({where}),
  ]);
  return {rows: rows.map(toLogEntry), total};
}

export async function pruneLogs(now: Date): Promise<number> {
  const result = await prisma.logEntry.deleteMany({
    where: {
      OR: [
        {
          type: {in: ['AUTH', 'AUDIT']},
          createdAt: {lt: new Date(now.getTime() - 90 * DAY_MS)},
        },
        {type: 'ERROR', createdAt: {lt: new Date(now.getTime() - 30 * DAY_MS)}},
      ],
    },
  });
  return result.count;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/data/queries/logs.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/queries/logs.ts src/data/queries/logs.spec.ts
git commit -m "feat(log): add getLogs and pruneLogs queries"
```

---

## Task 8: Logs API route

**Files:**
- Create: `src/pages/api/admin/logs/index.ts`
- Test: `src/pages/api/admin/logs/__tests__/index.spec.ts`

- [ ] **Step 1: Write the failing test**

`src/pages/api/admin/logs/__tests__/index.spec.ts`:

```typescript
import {createMocks} from 'node-mocks-http';
import handler from '../index';
import {getLogs} from '@/data/queries/logs';

jest.mock('@/data/queries/logs', () => ({getLogs: jest.fn()}));
jest.mock('@/lib/api-handler', () => ({
  withApiHandler: (h: unknown) => h, // bypass wrapper in unit test
}));

beforeEach(() => jest.clearAllMocks());

it('returns paginated logs for GET with filters', async () => {
  (getLogs as jest.Mock).mockResolvedValue({rows: [{id: 'l1'}], total: 1});
  const {req, res} = createMocks({
    method: 'GET',
    query: {type: 'ERROR', page: '2', pageSize: '10'},
  });
  await (handler as never)(req, res);
  expect(getLogs).toHaveBeenCalledWith(
    expect.objectContaining({type: 'ERROR'}),
    {page: 2, pageSize: 10},
  );
  expect(res._getStatusCode()).toBe(200);
  expect(JSON.parse(res._getData())).toEqual({rows: [{id: 'l1'}], total: 1});
});

it('rejects non-GET with 405', async () => {
  const {req, res} = createMocks({method: 'POST'});
  await (handler as never)(req, res);
  expect(res._getStatusCode()).toBe(405);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/pages/api/admin/logs/__tests__/index.spec.ts`
Expected: FAIL — cannot find module `../index`.

- [ ] **Step 3: Write the route**

`src/pages/api/admin/logs/index.ts`:

```typescript
import type {NextApiRequest, NextApiResponse} from 'next';
import {withApiHandler} from '@/lib/api-handler';
import {getLogs} from '@/data/queries/logs';
import type {LogFilters, LogLevel, LogType} from '@/domain/log/types';

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({error: 'Method not allowed'});
  }

  const filters: LogFilters = {
    type: str(req.query.type) as LogType | undefined,
    level: str(req.query.level) as LogLevel | undefined,
    userId: str(req.query.userId),
    from: str(req.query.from),
    to: str(req.query.to),
  };
  const page = Number(str(req.query.page) ?? '1') || 1;
  const pageSize = Math.min(Number(str(req.query.pageSize) ?? '25') || 25, 100);

  const result = await getLogs(filters, {page, pageSize});
  return res.status(200).json(result);
}

export default withApiHandler(handler, {requireAdmin: true});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/pages/api/admin/logs/__tests__/index.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/admin/logs
git commit -m "feat(log): add GET /api/admin/logs route"
```

---

## Task 9: Routes registry + API client

**Files:**
- Modify: `src/routes/registry.ts`
- Modify: `src/routes/api.ts`

- [ ] **Step 1: Add the route to the admin section in `registry.ts`**

Inside the `admin: { ... }` object (alongside `users`, `roles`, etc.):

```typescript
    logs: {list: {path: () => '/admin/logs'}},
```

- [ ] **Step 2: Add the api client to `api.ts`**

First add a type import near the top of `api.ts`:

```typescript
import type {LogEntryDTO, LogFilters} from '@/domain/log/types';
```

Inside `api.admin = { ... }`:

```typescript
    logs: {
      list: (params: LogFilters & {page?: number; pageSize?: number}) => {
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== '') qs.set(k, String(v));
        }
        return request<{rows: LogEntryDTO[]; total: number}>(
          `/api/admin/logs?${qs.toString()}`,
        );
      },
    },
```

- [ ] **Step 3: Verify types**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/routes/registry.ts src/routes/api.ts
git commit -m "feat(log): register /admin/logs route and api client"
```

---

## Task 10: Admin nav item

**Files:**
- Modify: `src/components/Admin/AdminLayout/AdminLayout.nav.ts`

- [ ] **Step 1: Add the nav item to the System group**

In the `System` group's `items` array, add:

```typescript
      {href: routes.admin.logs.list.path(), label: 'Logs', icon: 'fa-clipboard-list'},
```

- [ ] **Step 2: Verify types**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/Admin/AdminLayout/AdminLayout.nav.ts
git commit -m "feat(log): add Logs nav item under System"
```

---

## Task 11: Log filters component

**Files:**
- Create: `src/components/Admin/Logs/LogFilters.tsx`
- Test: `src/components/Admin/Logs/LogFilters.spec.tsx`

- [ ] **Step 1: Write the failing test**

`src/components/Admin/Logs/LogFilters.spec.tsx`:

```typescript
import {render, screen, fireEvent} from '@testing-library/react';
import {LogFilters} from './LogFilters';

it('calls onChange when the type filter changes', () => {
  const onChange = jest.fn();
  render(<LogFilters value={{}} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText('Type'), {target: {value: 'ERROR'}});
  expect(onChange).toHaveBeenCalledWith({type: 'ERROR'});
});

it('calls onChange when a date is set', () => {
  const onChange = jest.fn();
  render(<LogFilters value={{}} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText('From'), {
    target: {value: '2026-05-01'},
  });
  expect(onChange).toHaveBeenCalledWith({from: '2026-05-01'});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/components/Admin/Logs/LogFilters.spec.tsx`
Expected: FAIL — cannot find module `./LogFilters`.

- [ ] **Step 3: Write the component**

`src/components/Admin/Logs/LogFilters.tsx`:

```typescript
import type {LogFilters as Filters} from '@/domain/log/types';

type Props = {
  value: Filters;
  onChange: (next: Filters) => void;
};

export function LogFilters({value, onChange}: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <label className="flex flex-col text-sm" htmlFor="log-type">
        Type
        <select
          id="log-type"
          aria-label="Type"
          className="cursor-pointer rounded border px-2 py-1"
          value={value.type ?? ''}
          onChange={(e) =>
            onChange({...value, type: (e.target.value || undefined) as Filters['type']})
          }
        >
          <option value="">All</option>
          <option value="AUDIT">Audit</option>
          <option value="AUTH">Auth</option>
          <option value="ERROR">Error</option>
        </select>
      </label>

      <label className="flex flex-col text-sm" htmlFor="log-level">
        Level
        <select
          id="log-level"
          aria-label="Level"
          className="cursor-pointer rounded border px-2 py-1"
          value={value.level ?? ''}
          onChange={(e) =>
            onChange({...value, level: (e.target.value || undefined) as Filters['level']})
          }
        >
          <option value="">All</option>
          <option value="INFO">Info</option>
          <option value="WARN">Warn</option>
          <option value="ERROR">Error</option>
        </select>
      </label>

      <label className="flex flex-col text-sm" htmlFor="log-from">
        From
        <input
          id="log-from"
          aria-label="From"
          type="date"
          className="cursor-pointer rounded border px-2 py-1"
          value={value.from ?? ''}
          onChange={(e) => onChange({...value, from: e.target.value || undefined})}
        />
      </label>

      <label className="flex flex-col text-sm" htmlFor="log-to">
        To
        <input
          id="log-to"
          aria-label="To"
          type="date"
          className="cursor-pointer rounded border px-2 py-1"
          value={value.to ?? ''}
          onChange={(e) => onChange({...value, to: e.target.value || undefined})}
        />
      </label>
    </div>
  );
}
```

> Note: this admin component uses the admin chrome convention (hardcoded English labels, not `next-intl`) consistent with existing admin pages. The CLAUDE.md "no raw strings in JSX" rule targets public-facing pages; admin chrome is English-only per existing admin patterns. If the codebase's admin pages localize labels, follow that instead — check a sibling admin component before finalizing.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/components/Admin/Logs/LogFilters.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Admin/Logs/LogFilters.tsx src/components/Admin/Logs/LogFilters.spec.tsx
git commit -m "feat(log): add LogFilters component"
```

---

## Task 12: Log detail drawer

**Files:**
- Create: `src/components/Admin/Logs/LogDetailDrawer.tsx`
- Test: `src/components/Admin/Logs/LogDetailDrawer.spec.tsx`

- [ ] **Step 1: Write the failing test**

`src/components/Admin/Logs/LogDetailDrawer.spec.tsx`:

```typescript
import {render, screen} from '@testing-library/react';
import {LogDetailDrawer} from './LogDetailDrawer';
import type {LogEntryDTO} from '@/domain/log/types';

const entry: LogEntryDTO = {
  id: 'l1',
  createdAt: '2026-05-31T10:00:00.000Z',
  type: 'ERROR',
  level: 'ERROR',
  message: 'boom',
  userId: 'u1',
  userEmail: 'a@b.com',
  method: 'GET',
  path: '/api/admin/tours',
  statusCode: 500,
  resource: 'tours',
  resourceId: null,
  durationMs: 5,
  ip: '1.2.3.4',
  meta: {stack: 'Error: boom\n  at x'},
};

it('renders the entry message and meta when open', () => {
  render(<LogDetailDrawer entry={entry} open onClose={() => {}} />);
  expect(screen.getByText('boom')).toBeInTheDocument();
  expect(screen.getByText(/Error: boom/)).toBeInTheDocument();
});

it('renders nothing when entry is null', () => {
  const {container} = render(
    <LogDetailDrawer entry={null} open={false} onClose={() => {}} />,
  );
  expect(container).toBeEmptyDOMElement();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/components/Admin/Logs/LogDetailDrawer.spec.tsx`
Expected: FAIL — cannot find module `./LogDetailDrawer`.

- [ ] **Step 3: Write the component**

`src/components/Admin/Logs/LogDetailDrawer.tsx`:

```typescript
import {Modal} from '@/components/ui/Modal';
import type {LogEntryDTO} from '@/domain/log/types';

type Props = {
  entry: LogEntryDTO | null;
  open: boolean;
  onClose: () => void;
};

function Row({label, value}: {label: string; value: React.ReactNode}) {
  return (
    <div className="flex gap-2 py-1 text-sm">
      <span className="w-28 shrink-0 font-medium text-gray-500">{label}</span>
      <span className="break-all">{value ?? '—'}</span>
    </div>
  );
}

export function LogDetailDrawer({entry, open, onClose}: Props) {
  if (!entry) return null;
  return (
    <Modal open={open} onClose={onClose} title="Log detail" size="lg">
      <Row label="Time" value={entry.createdAt} />
      <Row label="Type" value={entry.type} />
      <Row label="Level" value={entry.level} />
      <Row label="Message" value={entry.message} />
      <Row label="User" value={entry.userEmail ?? entry.userId} />
      <Row label="Method" value={entry.method} />
      <Row label="Path" value={entry.path} />
      <Row label="Status" value={entry.statusCode} />
      <Row label="Resource" value={[entry.resource, entry.resourceId].filter(Boolean).join('/')} />
      <Row label="Duration" value={entry.durationMs != null ? `${entry.durationMs}ms` : null} />
      <Row label="IP" value={entry.ip} />
      <div className="mt-3">
        <span className="text-sm font-medium text-gray-500">Meta</span>
        <pre className="mt-1 max-h-80 overflow-auto rounded bg-gray-900 p-3 text-xs text-gray-100">
          {JSON.stringify(entry.meta, null, 2)}
        </pre>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/components/Admin/Logs/LogDetailDrawer.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Admin/Logs/LogDetailDrawer.tsx src/components/Admin/Logs/LogDetailDrawer.spec.tsx
git commit -m "feat(log): add LogDetailDrawer component"
```

---

## Task 13: Logs viewer page

**Files:**
- Create: `src/pages/admin/logs/index.tsx`
- Test: `src/pages/admin/logs/index.spec.tsx`

> Before writing, open `src/pages/admin/reviews/index.tsx` to copy the exact `AdminPageShell` + `AdminPageHeader` + `DataGrid` import paths and props used in this codebase, and `src/data/queries`/`getStaticProps` locale-message loading pattern used by other admin pages.

- [ ] **Step 1: Write the failing test**

`src/pages/admin/logs/index.spec.tsx`:

```typescript
import {render, screen, waitFor, fireEvent} from '@testing-library/react';
import LogsPage from './index';
import {api} from '@/routes';

jest.mock('@/routes', () => ({
  api: {admin: {logs: {list: jest.fn()}}},
  routes: {admin: {logs: {list: {path: () => '/admin/logs'}}}},
}));

// AdminPageShell/Header pull session + stats; stub to render children only.
jest.mock('@/components/Admin/AdminLayout', () => ({
  AdminPageShell: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
  AdminPageHeader: () => <div />,
}));

const row = {
  id: 'l1',
  createdAt: '2026-05-31T10:00:00.000Z',
  type: 'ERROR',
  level: 'ERROR',
  message: 'boom',
  userId: null,
  userEmail: null,
  method: 'GET',
  path: '/api/admin/tours',
  statusCode: 500,
  resource: 'tours',
  resourceId: null,
  durationMs: 5,
  ip: null,
  meta: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  (api.admin.logs.list as jest.Mock).mockResolvedValue({
    data: {rows: [row], total: 1},
    error: null,
  });
});

it('loads and renders log rows', async () => {
  render(<LogsPage />);
  await waitFor(() => expect(screen.getByText('boom')).toBeInTheDocument());
});

it('refetches when a filter changes', async () => {
  render(<LogsPage />);
  await waitFor(() => expect(api.admin.logs.list).toHaveBeenCalledTimes(1));
  fireEvent.change(screen.getByLabelText('Type'), {target: {value: 'AUDIT'}});
  await waitFor(() =>
    expect(api.admin.logs.list).toHaveBeenCalledWith(
      expect.objectContaining({type: 'AUDIT'}),
    ),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/pages/admin/logs/index.spec.tsx`
Expected: FAIL — cannot find module `./index`.

- [ ] **Step 3: Write the page**

`src/pages/admin/logs/index.tsx` (adjust `AdminPageShell`/`AdminPageHeader`/`DataGrid` import paths to match what you saw in `reviews/index.tsx`):

```typescript
import {useCallback, useEffect, useRef, useState} from 'react';
import {AdminPageShell, AdminPageHeader} from '@/components/Admin/AdminLayout';
import {DataGrid} from '@/components/Admin/DataGrid';
import {Button} from '@/components/ui/Button';
import {LogFilters} from '@/components/Admin/Logs/LogFilters';
import {LogDetailDrawer} from '@/components/Admin/Logs/LogDetailDrawer';
import {api} from '@/routes';
import type {GridColumn} from '@/components/Admin/DataGrid/DataGrid.types';
import type {LogEntryDTO, LogFilters as Filters} from '@/domain/log/types';

const REFRESH_MS = 10_000;

const columns: GridColumn<LogEntryDTO>[] = [
  {key: 'createdAt', header: 'Time', track: '180px', render: (r) => new Date(r.createdAt).toLocaleString()},
  {key: 'type', header: 'Type', track: '90px'},
  {key: 'level', header: 'Level', track: '80px'},
  {key: 'message', header: 'Message', track: 'minmax(0,2fr)'},
  {key: 'path', header: 'Path', track: 'minmax(0,1fr)', render: (r) => r.path ?? '—'},
  {key: 'statusCode', header: 'Status', track: '80px', align: 'end', render: (r) => r.statusCode ?? '—'},
];

export default function LogsPage() {
  const [filters, setFilters] = useState<Filters>({});
  const [rows, setRows] = useState<LogEntryDTO[]>([]);
  const [selected, setSelected] = useState<LogEntryDTO | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = useCallback(async () => {
    const {data} = await api.admin.logs.list({...filters, page: 1, pageSize: 100});
    if (data) setRows(data.rows);
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!autoRefresh) return;
    timer.current = setInterval(load, REFRESH_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [autoRefresh, load]);

  return (
    <AdminPageShell
      header={<AdminPageHeader title="Logs" subtitle="Server activity & audit trail" />}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <LogFilters value={filters} onChange={setFilters} />
          <Button
            variant={autoRefresh ? 'primary' : 'secondary'}
            onClick={() => setAutoRefresh((v) => !v)}
          >
            {autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
          </Button>
        </div>
        <DataGrid
          columns={columns}
          items={rows}
          rowKey={(r) => r.id}
          onRowClick={setSelected}
          ariaLabel="Server logs"
          emptyState="No log entries."
        />
      </div>
      <LogDetailDrawer
        entry={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </AdminPageShell>
  );
}
```

> If other admin pages export a `getStaticProps` to load locale messages, add the same `getStaticProps` here (copy verbatim from `reviews/index.tsx`). Pages without it that still render fine need none.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/pages/admin/logs/index.spec.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/logs
git commit -m "feat(log): add admin logs viewer page with filters, drawer, auto-refresh"
```

---

## Task 14: Prune cron script + VPS docs

**Files:**
- Create: `scripts/prune-logs.ts`
- Modify: `package.json` (add a `logs:prune` script)
- Modify: `.claude/VPS.md`

- [ ] **Step 1: Write the prune script**

`scripts/prune-logs.ts`:

```typescript
import {pruneLogs} from '@/data/queries/logs';
import {logger} from '@/lib/logger';

async function main() {
  const deleted = await pruneLogs(new Date());
  logger.info({deleted}, 'log prune complete');
  // eslint-disable-next-line no-console
  console.log(`Pruned ${deleted} log entries`);
  process.exit(0);
}

main().catch((err) => {
  logger.error({err}, 'log prune failed');
  process.exit(1);
});
```

> Note: this script imports via the `@/` alias. Run it through `tsx` (already used by `db:seed`). If `tsx` cannot resolve `@/`, mirror the working invocation used by `prisma/seed.ts` (check whether seed uses a tsconfig path loader) and match it.

- [ ] **Step 2: Add the npm script**

In `package.json` scripts, add:

```json
    "logs:prune": "npx tsx scripts/prune-logs.ts",
```

- [ ] **Step 3: Verify the script runs**

Run: `pnpm logs:prune`
Expected: prints `Pruned N log entries`, exit 0. (N may be 0 on a fresh DB.)

- [ ] **Step 4: Document the cron install in `.claude/VPS.md`**

Add a section:

```markdown
## Log retention cron

Prune old `LogEntry` rows (AUTH/AUDIT > 90d, ERROR > 30d). Install as a daily
system cron on the VPS (manual step — not part of deploy.yml):

    # crontab -e  (as the app user)
    0 4 * * * cd /var/www/vietnam-moto-tours && pnpm logs:prune >> /var/log/vmt-logs-prune.log 2>&1
```

- [ ] **Step 5: Commit**

```bash
git add scripts/prune-logs.ts package.json .claude/VPS.md
git commit -m "feat(log): add prune-logs cron script and VPS docs"
```

---

## Task 15: Migrate first admin handlers to withApiHandler

Migrate three representative handlers so audit/error capture is live. Pattern repeats for the rest later.

**Files:**
- Modify: `src/pages/api/admin/tours/index.ts`
- Modify: `src/pages/api/admin/users/index.ts` (if present; else `roles/index.ts`)
- Modify: `src/pages/api/admin/reviews/index.ts`

- [ ] **Step 1: Wrap the tours handler**

In `src/pages/api/admin/tours/index.ts`:
- Remove the in-handler `const isAuthed = await requireAdmin(req, res); if (!isAuthed) return;` lines (the wrapper handles auth).
- Change `export default async function handler(...)` to a named `async function handler(...)`.
- Add at top: `import {withApiHandler} from '@/lib/api-handler';`
- At the bottom: `export default withApiHandler(handler, {requireAdmin: true});`

- [ ] **Step 2: Run the existing tours handler tests**

Run: `pnpm test src/pages/api/admin/tours`
Expected: PASS. If a test mocked `requireAdmin` directly and now fails because auth moved to the wrapper, update that test to mock `@/lib/api-handler` (`withApiHandler: (h) => h`) the same way Task 8's test does, OR mock `getServerSession` + `requireAdmin` to pass. Prefer bypassing the wrapper in unit tests.

- [ ] **Step 3: Repeat Step 1 for users (or roles) and reviews handlers**

Apply the identical transformation. Run their tests after each:

Run: `pnpm test src/pages/api/admin/users src/pages/api/admin/reviews`
Expected: PASS.

- [ ] **Step 4: Full typecheck + test suite**

Run: `pnpm typecheck && pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/admin/tours src/pages/api/admin/users src/pages/api/admin/reviews
git commit -m "refactor(log): wrap tours/users/reviews handlers with withApiHandler"
```

---

## Task 16: Final verification

- [ ] **Step 1: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 3: Full test suite**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 4: Build**

Run: `pnpm build`
Expected: success (type checking + page-data collection pass).

- [ ] **Step 5: Manual smoke (dev)**

Run: `pnpm dev`, log in as admin, visit `/admin/logs`. Trigger a mutation elsewhere (edit a tour) and confirm an AUDIT row appears after auto-refresh; open a row to see the drawer.

---

## Self-Review Notes

- **Spec coverage:** audit/auth/error capture (Tasks 5, 6), request traffic to stdout (Task 5 `logger.info`), Postgres storage (Tasks 2, 4), pino foundation (Tasks 1, 4), scrubbing (Task 4), viewer with filters/drawer/auto-refresh (Tasks 11–13), no full-text search (omitted by design), cron prune 90/30d (Task 14), nav item (Task 10), routes (Task 9), incremental handler migration (Task 15). All spec sections mapped.
- **Type consistency:** `LogEntryDTO`, `LogFilters`, `WriteLogInput`, `withApiHandler(handler, opts)`, `getLogs(filters, page)`, `pruneLogs(now)` used consistently across tasks.
- **Known limitation carried from spec:** audit captures request body snapshot, not before/after diff.
