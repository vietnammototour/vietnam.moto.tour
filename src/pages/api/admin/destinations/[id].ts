import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  const id = req.query.id as string;

  if (req.method === 'GET') {
    const destination = await prisma.destination.findUnique({where: {id}});
    if (!destination)
      return res.status(404).json({error: 'Destination not found'});
    return res.json(destination);
  }

  if (req.method === 'PUT') {
    const data = req.body;
    const destination = await prisma.destination.update({
      where: {id},
      data: {
        slug: data.slug,
        name: data.name,
        nameVi: data.nameVi,
        nameEn: data.nameEn,
        imageUrl: data.imageUrl,
        heroImage: data.heroImage,
        descriptionVi: data.descriptionVi,
        descriptionEn: data.descriptionEn,
        size: data.size,
        isActive: data.isActive,
      },
    });
    return res.json(destination);
  }

  if (req.method === 'DELETE') {
    if (req.query.hard === 'true') {
      const existing = await prisma.destination.findUnique({
        where: {id},
        select: {isActive: true, _count: {select: {tours: true}}},
      });
      if (!existing)
        return res.status(404).json({error: 'Destination not found'});
      if (existing.isActive) {
        return res
          .status(409)
          .json({
            error: 'Destination must be archived before permanent deletion',
          });
      }
      if (existing._count.tours > 0) {
        return res
          .status(409)
          .json({
            error: 'Destination has tours; remove or reassign them first',
          });
      }
      await prisma.destination.delete({where: {id}});
      return res.status(204).end();
    }
    await prisma.destination.update({where: {id}, data: {isActive: false}});
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
