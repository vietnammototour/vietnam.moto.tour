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
    const {getTourByIdForAdmin} = await import('@/data/queries');
    const tour = await getTourByIdForAdmin(id);
    if (!tour) return res.status(404).json({error: 'Tour not found'});
    return res.json(tour);
  }

  if (req.method === 'PUT') {
    const data = req.body;
    const updateData: Record<string, unknown> = {};
    const fields = [
      'slug',
      'destinationId',
      'titleVi',
      'titleEn',
      'imageUrl',
      'duration',
      'distance',
      'descriptionVi',
      'descriptionEn',
      'transportation',
      'hotel',
      'guided',
      'images',
      'itinerary',
      'pricingGroups',
      'paymentDetails',
      'notes',
      'mealsInfo',
      'status',
      'tripadvisorLocationId',
    ];
    for (const field of fields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }
    // Empty optional external id means "no listing" — store null, not ''.
    if (updateData.tripadvisorLocationId === '') {
      updateData.tripadvisorLocationId = null;
    }
    // Handle highlights relation separately — only allow highlights from the tour's destination
    if (data.highlightIds !== undefined) {
      const tour = await prisma.tour.findUnique({
        where: {id},
        select: {destinationId: true},
      });
      if (!tour) return res.status(404).json({error: 'Tour not found'});

      const destId = (updateData.destinationId as string) ?? tour.destinationId;
      const validHighlights = await prisma.highlight.findMany({
        where: {id: {in: data.highlightIds}, destinationId: destId},
        select: {id: true},
      });
      updateData.highlights = {
        set: validHighlights.map((h: {id: string}) => ({id: h.id})),
      };
    }
    // Handle perks (replace-all semantics)
    const hasIncluded = Array.isArray(data.includedPerkIds);
    const hasExcluded = Array.isArray(data.excludedPerkIds);
    let perkOps: Array<Promise<unknown>> | null = null;
    if (hasIncluded || hasExcluded) {
      const includedIds: string[] = hasIncluded ? data.includedPerkIds : [];
      const excludedIds: string[] = hasExcluded ? data.excludedPerkIds : [];

      const overlap = includedIds.filter((pid) => excludedIds.includes(pid));
      if (overlap.length > 0) {
        return res
          .status(400)
          .json({error: 'Perk cannot be in both included and excluded lists'});
      }

      const allRequested = [...new Set([...includedIds, ...excludedIds])];
      if (allRequested.length > 0) {
        const validPerks = await prisma.perk.findMany({
          where: {id: {in: allRequested}},
          select: {id: true},
        });
        const validSet = new Set(validPerks.map((p: {id: string}) => p.id));
        const filteredIncluded = includedIds.filter((pid) => validSet.has(pid));
        const filteredExcluded = excludedIds.filter((pid) => validSet.has(pid));
        perkOps = [
          prisma.tourPerk.deleteMany({where: {tourId: id}}),
          prisma.tourPerk.createMany({
            data: [
              ...filteredIncluded.map((perkId) => ({
                tourId: id,
                perkId,
                bucket: 'INCLUDED' as const,
              })),
              ...filteredExcluded.map((perkId) => ({
                tourId: id,
                perkId,
                bucket: 'EXCLUDED' as const,
              })),
            ],
          }),
        ];
      } else {
        perkOps = [prisma.tourPerk.deleteMany({where: {tourId: id}})];
      }
    }

    const updatedTour = perkOps
      ? await prisma
          .$transaction([
            prisma.tour.update({where: {id}, data: updateData}),
            ...perkOps,
          ])
          .then((results: unknown[]) => results[0])
      : await prisma.tour.update({where: {id}, data: updateData});
    return res.json(updatedTour);
  }

  if (req.method === 'DELETE') {
    if (req.query.hard === 'true') {
      const existing = await prisma.tour.findUnique({
        where: {id},
        select: {status: true},
      });
      if (!existing) return res.status(404).json({error: 'Tour not found'});
      if (existing.status !== 'ARCHIVED') {
        return res
          .status(409)
          .json({error: 'Tour must be archived before permanent deletion'});
      }
      await prisma.tour.delete({where: {id}});
      return res.status(204).end();
    }
    await prisma.tour.update({where: {id}, data: {status: 'ARCHIVED'}});
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
