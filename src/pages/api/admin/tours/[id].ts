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
    const tour = await prisma.tour.findUnique({
      where: {id},
      include: {highlights: true},
    });
    if (!tour) return res.status(404).json({error: 'Tour not found'});
    return res.json(tour);
  }

  if (req.method === 'PUT') {
    const data = req.body;
    const updateData: Record<string, unknown> = {};
    const fields = [
      'slug',
      'destinationId',
      'title',
      'titleVi',
      'titleEn',
      'imageUrl',
      'rating',
      'price',
      'duration',
      'distance',
      'descriptionVi',
      'descriptionEn',
      'transportation',
      'groupSize',
      'hotel',
      'guided',
      'images',
      'itinerary',
      'pricingGroups',
      'included',
      'excluded',
      'paymentDetails',
      'notes',
      'mealsInfo',
      'status',
    ];
    for (const field of fields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }
    // Handle highlights relation separately
    if (data.highlightIds !== undefined) {
      updateData.highlights = {
        set: data.highlightIds.map((hId: string) => ({id: hId})),
      };
    }
    const tour = await prisma.tour.update({
      where: {id},
      data: updateData,
    });
    return res.json(tour);
  }

  if (req.method === 'DELETE') {
    await prisma.tour.update({where: {id}, data: {status: 'ARCHIVED'}});
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
