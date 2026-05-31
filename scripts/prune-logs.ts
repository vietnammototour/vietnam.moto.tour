import {pruneLogs} from '@/data/queries/logs';
import {logger} from '@/lib/logger';

async function main(): Promise<void> {
  const deleted = await pruneLogs(new Date());
  logger.info({deleted}, 'log prune complete');
  console.log(`Pruned ${deleted} log entries`);
  process.exit(0);
}

main().catch((err) => {
  logger.error({err}, 'log prune failed');
  process.exit(1);
});
