import {createMocks} from 'node-mocks-http';
import handler from '../[id]';
import restoreHandler from '../[id]/restore';
import {requireAdmin} from '@/lib/admin-auth';
import {prisma} from '@/lib/prisma';

jest.mock('@/lib/admin-auth', () => ({requireAdmin: jest.fn()}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    vehicle: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  (requireAdmin as jest.Mock).mockResolvedValue(true);
});

const row = {
  id: 'v1',
  slug: 'honda-airblade',
  type: 'SCOOTER',
  brand: 'Honda',
  model: 'Airblade',
  cc: 125,
  quantity: 2,
  priceUsdPerDay: 8,
  imageUrl: null,
  images: [],
  description: {en: '', vi: ''},
  status: 'PUBLISHED',
  order: 0,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('GET /api/admin/vehicles/[id]', () => {
  it('returns 404 when not found', async () => {
    (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue(null);
    const {req, res} = createMocks({method: 'GET', query: {id: 'v1'}});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(404);
  });

  it('returns mapped vehicle', async () => {
    (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue(row);
    const {req, res} = createMocks({method: 'GET', query: {id: 'v1'}});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData()).id).toBe('v1');
  });
});

describe('DELETE /api/admin/vehicles/[id]', () => {
  it('soft-archives by setting status=ARCHIVED', async () => {
    (prisma.vehicle.update as jest.Mock).mockResolvedValue({
      ...row,
      status: 'ARCHIVED',
    });
    const {req, res} = createMocks({method: 'DELETE', query: {id: 'v1'}});
    await handler(req as never, res as never);
    expect(prisma.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {id: 'v1'},
        data: {status: 'ARCHIVED'},
      }),
    );
    expect(res._getStatusCode()).toBe(204);
  });
});

describe('PUT /api/admin/vehicles/[id]', () => {
  it('updates only the provided fields', async () => {
    (prisma.vehicle.update as jest.Mock).mockResolvedValue({
      ...row,
      quantity: 5,
    });
    const {req, res} = createMocks({
      method: 'PUT',
      query: {id: 'v1'},
      body: {quantity: 5},
    });
    await handler(req as never, res as never);
    expect(prisma.vehicle.update).toHaveBeenCalledWith({
      where: {id: 'v1'},
      data: {quantity: 5},
    });
    expect(res._getStatusCode()).toBe(200);
  });

  it('rejects invalid type', async () => {
    const {req, res} = createMocks({
      method: 'PUT',
      query: {id: 'v1'},
      body: {type: 'TRUCK'},
    });
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(400);
    expect(prisma.vehicle.update).not.toHaveBeenCalled();
  });

  it('rejects negative numeric fields', async () => {
    const {req, res} = createMocks({
      method: 'PUT',
      query: {id: 'v1'},
      body: {priceUsdPerDay: -1},
    });
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(400);
    expect(prisma.vehicle.update).not.toHaveBeenCalled();
  });

  it('rejects partial description payload', async () => {
    const {req, res} = createMocks({
      method: 'PUT',
      query: {id: 'v1'},
      body: {description: {vi: 'only vi'}},
    });
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(400);
    expect(prisma.vehicle.update).not.toHaveBeenCalled();
  });
});

describe('POST /api/admin/vehicles/[id]/restore', () => {
  it('sets status to DRAFT', async () => {
    (prisma.vehicle.update as jest.Mock).mockResolvedValue({
      ...row,
      status: 'DRAFT',
    });
    const {req, res} = createMocks({method: 'POST', query: {id: 'v1'}});
    await restoreHandler(req as never, res as never);
    expect(prisma.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {id: 'v1'},
        data: {status: 'DRAFT'},
      }),
    );
    expect(res._getStatusCode()).toBe(200);
  });

  it('rejects non-POST methods with 405', async () => {
    const {req, res} = createMocks({method: 'GET', query: {id: 'v1'}});
    await restoreHandler(req as never, res as never);
    expect(res._getStatusCode()).toBe(405);
    expect(res.getHeader('Allow')).toBe('POST');
  });
});
