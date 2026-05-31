import {createMocks} from 'node-mocks-http';
import handler from '../index';
import {getLogs} from '@/data/queries/logs';

jest.mock('@/data/queries/logs', () => ({getLogs: jest.fn()}));
jest.mock('@/lib/api-handler', () => ({
  withApiHandler: (h: unknown) => h,
}));

beforeEach(() => jest.clearAllMocks());

it('returns paginated logs for GET with filters', async () => {
  (getLogs as jest.Mock).mockResolvedValue({rows: [{id: 'l1'}], total: 1});
  const {req, res} = createMocks({
    method: 'GET',
    query: {type: 'ERROR', page: '2', pageSize: '10'},
  });
  await handler(req as never, res as never);
  expect(getLogs).toHaveBeenCalledWith(
    expect.objectContaining({type: 'ERROR'}),
    {page: 2, pageSize: 10},
  );
  expect(res._getStatusCode()).toBe(200);
  expect(JSON.parse(res._getData())).toEqual({rows: [{id: 'l1'}], total: 1});
});

it('rejects non-GET with 405', async () => {
  const {req, res} = createMocks({method: 'POST'});
  await handler(req as never, res as never);
  expect(res._getStatusCode()).toBe(405);
});
