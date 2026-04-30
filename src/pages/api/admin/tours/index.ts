import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  if (req.method === 'GET') {
    const tours = await prisma.tour.findMany({
      orderBy: {createdAt: 'desc'},
      include: {destination: {select: {name: true}}},
    });
    return res.json(tours);
  }

  if (req.method === 'POST') {
    const data = req.body;
    const tour = await prisma.tour.create({
      data: {
        slug: data.slug,
        destinationId: data.destinationId,
        title: data.title,
        titleVi: data.titleVi ?? '',
        titleEn: data.titleEn ?? '',
        imageUrl: data.imageUrl ?? '',
        rating: data.rating ?? '',
        price: data.price ?? 0,
        duration: data.duration ?? '',
        distance: data.distance ?? '',
        descriptionVi: data.descriptionVi ?? '',
        descriptionEn: data.descriptionEn ?? '',
        transportation: data.transportation ?? '',
        groupSize: data.groupSize ?? '',
        hotel: data.hotel ?? '',
        guided: data.guided ?? '',
        images: data.images ?? [],
        highlights: data.highlights ?? [],
        itinerary: data.itinerary ?? [],
        pricingGroups: data.pricingGroups ?? [],
        included: data.included ?? [],
        excluded: data.excluded ?? [],
        paymentDetails: data.paymentDetails ?? {},
        notes: data.notes ?? [],
        mealsInfo: data.mealsInfo ?? {},
      },
    });
    return res.status(201).json(tour);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
