import handler from '../index';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import type {NextApiRequest, NextApiResponse} from 'next';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    perk: {findMany: jest.fn(), create: jest.fn()},
  },
}));
jest.mock('@/lib/admin-auth', () => ({requireAdmin: jest.fn()}));

const mockReq = (overrides: Partial<NextApiRequest> = {}) =>
  ({method: 'GET', query: {}, body: {}, ...overrides}) as NextApiRequest;

const mockRes = () => {
  const res = {} as NextApiResponse & {_status?: number; _json?: unknown};
  res.status = jest.fn().mockImplementation((s) => {
    (res as never as {_status: number})._status = s;
    return res;
  });
  res.json = jest.fn().mockImplementation((j) => {
    (res as never as {_json: unknown})._json = j;
    return res;
  });
  res.setHeader = jest.fn();
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  (requireAdmin as jest.Mock).mockResolvedValue(true);
});

describe('GET /api/admin/perks', () => {
  it('lists perks ordered by category then labelEn', async () => {
    (prisma.perk.findMany as jest.Mock).mockResolvedValue([{id: '1'}]);
    const res = mockRes();
    await handler(mockReq({method: 'GET'}), res);
    expect(prisma.perk.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: [{category: 'asc'}, {labelEn: 'asc'}],
    });
    expect(res.json).toHaveBeenCalledWith([{id: '1'}]);
  });

  it('filters by category when query param given', async () => {
    (prisma.perk.findMany as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    await handler(mockReq({method: 'GET', query: {category: 'FOOD'}}), res);
    expect(prisma.perk.findMany).toHaveBeenCalledWith({
      where: {category: 'FOOD'},
      orderBy: [{category: 'asc'}, {labelEn: 'asc'}],
    });
  });
});

describe('POST /api/admin/perks', () => {
  it('rejects when labelEn missing', async () => {
    const res = mockRes();
    await handler(
      mockReq({
        method: 'POST',
        body: {labelVi: 'x', icon: 'i', category: 'OTHER'},
      }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('creates perk with defaults', async () => {
    (prisma.perk.create as jest.Mock).mockResolvedValue({id: '1'});
    const res = mockRes();
    await handler(
      mockReq({
        method: 'POST',
        body: {
          labelEn: 'Bike',
          labelVi: 'Xe',
          icon: 'fa-solid fa-motorcycle',
          category: 'TRANSPORT',
        },
      }),
      res,
    );
    expect(prisma.perk.create).toHaveBeenCalledWith({
      data: {
        labelEn: 'Bike',
        labelVi: 'Xe',
        icon: 'fa-solid fa-motorcycle',
        category: 'TRANSPORT',
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
