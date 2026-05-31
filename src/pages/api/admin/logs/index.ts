import type {NextApiRequest, NextApiResponse} from 'next';
import {withApiHandler} from '@/lib/api-handler';
import {getLogs} from '@/data/queries/logs';
import type {LogFilters, LogLevel, LogType} from '@/domain/log/types';

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({error: 'Method not allowed'});
  }

  const filters: LogFilters = {
    type: str(req.query.type) as LogType | undefined,
    level: str(req.query.level) as LogLevel | undefined,
    userId: str(req.query.userId),
    from: str(req.query.from),
    to: str(req.query.to),
  };
  const page = Number(str(req.query.page) ?? '1') || 1;
  const pageSize = Math.min(Number(str(req.query.pageSize) ?? '25') || 25, 100);

  const result = await getLogs(filters, {page, pageSize});
  return res.status(200).json(result);
}

export default withApiHandler(handler, {requireAdmin: true});
