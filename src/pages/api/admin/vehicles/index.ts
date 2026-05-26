import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {toVehicle} from '@/domain/vehicle/mapper';

const VALID_TYPES = ['SCOOTER', 'BIKE'] as const;
const VALID_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

type CreateBody = {
  slug?: string;
  type?: string;
  brand?: string;
  model?: string;
  cc?: number;
  quantity?: number;
  priceUsdPerDay?: number;
  imageUrl?: string | null;
  images?: string[];
  description?: {en?: string; vi?: string};
  status?: string;
  order?: number;
};

function validateCreate(body: CreateBody): string | null {
  if (!body.slug || typeof body.slug !== 'string') return 'slug is required';
  if (!body.type || !VALID_TYPES.includes(body.type as never))
    return 'type must be SCOOTER or BIKE';
  if (!body.brand) return 'brand is required';
  if (!body.model) return 'model is required';
  if (typeof body.cc !== 'number' || body.cc <= 0) return 'cc must be > 0';
  if (typeof body.quantity !== 'number' || body.quantity < 0)
    return 'quantity must be >= 0';
  if (typeof body.priceUsdPerDay !== 'number' || body.priceUsdPerDay < 0)
    return 'priceUsdPerDay must be >= 0';
  if (body.status && !VALID_STATUSES.includes(body.status as never))
    return 'status invalid';
  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  if (req.method === 'GET') {
    const archivedParam = req.query.archived;
    const filters = (() => {
      if (archivedParam === 'true') return {archived: true};
      if (archivedParam === 'false') return {archived: false};
      return {};
    })();
    const {getVehiclesForAdmin} = await import('@/data/queries');
    const vehicles = await getVehiclesForAdmin(filters);
    return res.json(vehicles);
  }

  if (req.method === 'POST') {
    const body = req.body as CreateBody;
    const err = validateCreate(body);
    if (err) return res.status(400).json({error: err});

    const row = await prisma.vehicle.create({
      data: {
        slug: body.slug!,
        type: body.type as 'SCOOTER' | 'BIKE',
        brand: body.brand!,
        model: body.model!,
        cc: body.cc!,
        quantity: body.quantity!,
        priceUsdPerDay: body.priceUsdPerDay!,
        imageUrl: body.imageUrl ?? null,
        images: (body.images ?? []) as never,
        description: {
          en: body.description?.en ?? '',
          vi: body.description?.vi ?? '',
        } as never,
        status: (body.status ?? 'DRAFT') as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
        order: body.order ?? 0,
      },
    });
    return res.status(201).json(toVehicle(row));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
