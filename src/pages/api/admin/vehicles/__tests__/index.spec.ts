import {createMocks} from 'node-mocks-http';
import handler from '../index';
import {requireAdmin} from '@/lib/admin-auth';
import {prisma} from '@/lib/prisma';

jest.mock('@/lib/admin-auth', () => ({requireAdmin: jest.fn()}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    vehicle: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  (requireAdmin as jest.Mock).mockResolvedValue(true);
});

const fakeRow = {
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
  status: 'DRAFT',
  order: 0,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('GET /api/admin/vehicles', () => {
  it('short-circuits when requireAdmin returns false', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(false);
    const {req, res} = createMocks({method: 'GET'});
    await handler(req as never, res as never);
    expect(prisma.vehicle.findMany).not.toHaveBeenCalled();
  });

  it('returns mapped vehicles', async () => {
    (prisma.vehicle.findMany as jest.Mock).mockResolvedValue([fakeRow]);
    const {req, res} = createMocks({method: 'GET'});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(200);
    const body = JSON.parse(res._getData());
    expect(body[0].id).toBe('v1');
    expect(body[0].createdAt).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('POST /api/admin/vehicles', () => {
  it('creates a vehicle and returns the mapped row', async () => {
    (prisma.vehicle.create as jest.Mock).mockResolvedValue(fakeRow);
    const {req, res} = createMocks({
      method: 'POST',
      body: {
        slug: 'honda-airblade',
        type: 'SCOOTER',
        brand: 'Honda',
        model: 'Airblade',
        cc: 125,
        quantity: 2,
        priceUsdPerDay: 8,
      },
    });
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(201);
    expect(prisma.vehicle.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        slug: 'honda-airblade',
        type: 'SCOOTER',
        brand: 'Honda',
        model: 'Airblade',
        cc: 125,
        quantity: 2,
        priceUsdPerDay: 8,
        status: 'DRAFT',
        order: 0,
        imageUrl: null,
        images: [],
        description: {en: '', vi: ''},
      }),
    });
    const body = JSON.parse(res._getData());
    expect(body.id).toBe('v1');
    expect(body.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('rejects missing required fields', async () => {
    const {req, res} = createMocks({
      method: 'POST',
      body: {brand: 'Honda'},
    });
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(400);
  });
});
