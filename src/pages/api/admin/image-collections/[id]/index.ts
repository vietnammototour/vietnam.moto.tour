import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {toImageCollection} from '@/domain/image-collection/mapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!(await requireAdmin(req, res))) return;
  const id = req.query.id as string;

  if (req.method === 'GET') {
    const row = await prisma.imageCollection.findUnique({
      where: {id},
      include: {images: {orderBy: {order: 'asc'}}},
    });
    if (!row) return res.status(404).json({error: 'Collection not found'});
    return res.json(toImageCollection(row));
  }

  if (req.method === 'PATCH') {
    const {label} = req.body ?? {};
    if (typeof label !== 'string' || label.trim().length === 0) {
      return res.status(400).json({error: 'label is required'});
    }
    const updated = await prisma.imageCollection.update({
      where: {id},
      data: {label},
    });
    return res.json(updated);
  }

  if (req.method === 'DELETE') {
    await prisma.imageCollection.delete({where: {id}});
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PATCH, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
