import type {NextApiRequest, NextApiResponse} from 'next';
import {getDestinationHighlightsPage} from '@/data/queries';
import {HIGHLIGHTS_PAGE_SIZE} from '@/domain';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({error: 'Method not allowed'});
  }

  const slug = req.query.slug;
  if (typeof slug !== 'string') {
    return res.status(400).json({error: 'Invalid slug'});
  }

  const skip = Math.max(
    0,
    Number.parseInt(String(req.query.skip ?? '0'), 10) || 0,
  );
  const takeRaw =
    Number.parseInt(String(req.query.take ?? HIGHLIGHTS_PAGE_SIZE), 10) ||
    HIGHLIGHTS_PAGE_SIZE;
  const take = Math.min(Math.max(1, takeRaw), 50);

  const page = await getDestinationHighlightsPage(slug, skip, take);
  if (!page) return res.status(404).json({error: 'Not found'});

  return res.json(page);
}
