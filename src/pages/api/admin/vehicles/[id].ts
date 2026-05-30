import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {toVehicle} from '@/domain/vehicle/mapper';
import {VEHICLE_TYPES, VEHICLE_STATUSES} from '@/domain/vehicle/constants';
import {normalizeSlug} from '@/utils';

type UpdateBody = Partial<{
  slug: string;
  type: string;
  brand: string;
  model: string;
  cc: number;
  quantity: number;
  priceUsdPerDay: number;
  imageUrl: string | null;
  images: string[];
  description: {en: string; vi: string};
  status: string;
  order: number;
}>;

function validateUpdate(body: UpdateBody): string | null {
  if (body.type && !VEHICLE_TYPES.includes(body.type as never))
    return 'type must be SCOOTER or BIKE';
  if (body.cc !== undefined && (typeof body.cc !== 'number' || body.cc <= 0))
    return 'cc must be > 0';
  if (
    body.quantity !== undefined &&
    (typeof body.quantity !== 'number' || body.quantity < 0)
  )
    return 'quantity must be >= 0';
  if (
    body.priceUsdPerDay !== undefined &&
    (typeof body.priceUsdPerDay !== 'number' || body.priceUsdPerDay < 0)
  )
    return 'priceUsdPerDay must be >= 0';
  if (body.status && !VEHICLE_STATUSES.includes(body.status as never))
    return 'status invalid';
  if (body.description !== undefined) {
    if (typeof body.description !== 'object' || body.description === null) {
      return 'description must be an object with en and vi keys';
    }
    if (
      typeof body.description.en !== 'string' ||
      typeof body.description.vi !== 'string'
    ) {
      return 'description must have both en and vi as strings';
    }
  }
  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  const id = String(req.query.id);

  if (req.method === 'GET') {
    const row = await prisma.vehicle.findUnique({where: {id}});
    if (!row) return res.status(404).json({error: 'Not found'});
    return res.json(toVehicle(row));
  }

  if (req.method === 'PUT') {
    const body = req.body as UpdateBody;
    const err = validateUpdate(body);
    if (err) return res.status(400).json({error: err});

    const row = await prisma.vehicle.update({
      where: {id},
      data: {
        ...(body.slug !== undefined ? {slug: normalizeSlug(body.slug)} : {}),
        ...(body.type !== undefined
          ? {type: body.type as 'SCOOTER' | 'BIKE'}
          : {}),
        ...(body.brand !== undefined ? {brand: body.brand} : {}),
        ...(body.model !== undefined ? {model: body.model} : {}),
        ...(body.cc !== undefined ? {cc: body.cc} : {}),
        ...(body.quantity !== undefined ? {quantity: body.quantity} : {}),
        ...(body.priceUsdPerDay !== undefined
          ? {priceUsdPerDay: body.priceUsdPerDay}
          : {}),
        ...(body.imageUrl !== undefined ? {imageUrl: body.imageUrl} : {}),
        ...(body.images !== undefined ? {images: body.images as never} : {}),
        ...(body.description !== undefined
          ? {
              description: {
                en: body.description.en ?? '',
                vi: body.description.vi ?? '',
              } as never,
            }
          : {}),
        ...(body.status !== undefined
          ? {status: body.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'}
          : {}),
        ...(body.order !== undefined ? {order: body.order} : {}),
      },
    });
    return res.json(toVehicle(row));
  }

  if (req.method === 'DELETE') {
    await prisma.vehicle.update({
      where: {id},
      data: {status: 'ARCHIVED'},
    });
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
