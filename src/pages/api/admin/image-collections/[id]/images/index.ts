import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

const MAX_IMAGES = 10;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!(await requireAdmin(req, res))) return;
  const collectionId = req.query.id as string;

  if (req.method === 'POST') {
    const collection = await prisma.imageCollection.findUnique({
      where: {id: collectionId},
      include: {_count: {select: {images: true}}},
    });
    if (!collection)
      return res.status(404).json({error: 'Collection not found'});
    if (collection._count.images >= MAX_IMAGES) {
      return res
        .status(400)
        .json({error: `max ${MAX_IMAGES} images per collection`});
    }
    const {altEn = '', altVi = ''} = req.body ?? {};
    const created = await prisma.collectionImage.create({
      data: {
        collectionId,
        altEn: typeof altEn === 'string' ? altEn : '',
        altVi: typeof altVi === 'string' ? altVi : '',
        order: collection._count.images,
      },
    });
    return res.status(201).json(created);
  }

  res.setHeader('Allow', 'POST');
  return res.status(405).json({error: 'Method not allowed'});
}
