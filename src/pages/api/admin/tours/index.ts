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
      include: {
        destination: {select: {name: true}},
        highlights: true,
      },
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
        duration: data.duration ?? 1,
        distance: data.distance ?? 0,
        descriptionVi: data.descriptionVi ?? '',
        descriptionEn: data.descriptionEn ?? '',
        transportation: data.transportation ?? '',
        hotel: data.hotel ?? '',
        guided: data.guided ?? '',
        images: data.images ?? [],
        itinerary: data.itinerary ?? [],
        pricingGroups: data.pricingGroups ?? [],
        paymentDetails: data.paymentDetails ?? {},
        notes: data.notes ?? [],
        mealsInfo: data.mealsInfo ?? {},
        status: data.status ?? 'DRAFT',
        highlights: data.highlightIds?.length
          ? {connect: data.highlightIds.map((id: string) => ({id}))}
          : undefined,
      },
      include: {highlights: true},
    });
    return res.status(201).json(tour);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
