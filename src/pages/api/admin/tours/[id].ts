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
    const tour = await prisma.tour.findUnique({where: {id}});
    if (!tour) return res.status(404).json({error: 'Tour not found'});
    return res.json(tour);
  }

  if (req.method === 'PUT') {
    const data = req.body;
    const tour = await prisma.tour.update({
      where: {id},
      data: {
        slug: data.slug,
        destinationId: data.destinationId,
        title: data.title,
        titleVi: data.titleVi,
        titleEn: data.titleEn,
        imageUrl: data.imageUrl,
        rating: data.rating,
        price: data.price,
        duration: data.duration,
        distance: data.distance,
        descriptionVi: data.descriptionVi,
        descriptionEn: data.descriptionEn,
        transportation: data.transportation,
        groupSize: data.groupSize,
        hotel: data.hotel,
        guided: data.guided,
        images: data.images,
        highlights: data.highlights,
        itinerary: data.itinerary,
        pricingGroups: data.pricingGroups,
        included: data.included,
        excluded: data.excluded,
        paymentDetails: data.paymentDetails,
        notes: data.notes,
        mealsInfo: data.mealsInfo,
        isActive: data.isActive,
      },
    });
    return res.json(tour);
  }

  if (req.method === 'DELETE') {
    await prisma.tour.update({where: {id}, data: {isActive: false}});
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
