import type {Translation as PrismaTranslation} from '@prisma/client';
import type {Translation} from './index';

export function toTranslation(row: PrismaTranslation): Translation {
  return {
    id: row.id,
    namespace: row.namespace,
    key: row.key,
    valueVi: row.valueVi,
    valueEn: row.valueEn,
  };
}
