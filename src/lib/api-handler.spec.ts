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
jest.mock('./auth', () => ({authOptions: {}}));

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
