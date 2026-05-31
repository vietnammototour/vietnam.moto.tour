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
  const segments = path.split('/').filter(Boolean);
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
