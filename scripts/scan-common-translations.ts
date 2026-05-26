import * as fs from 'fs';
import * as path from 'path';
import {createPrisma} from './lib/translation-db';
import {findCandidates, TranslationRow} from './lib/scan';

async function main() {
  const prisma = createPrisma();
  try {
    const rows = (await prisma.translation.findMany({
      select: {namespace: true, key: true, valueVi: true, valueEn: true},
    })) as TranslationRow[];

    const result = findCandidates(rows);

    const outPath = path.join(__dirname, '.common-keys-candidates.json');
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(`Wrote ${outPath}`);
    console.log(
      `byKey groups: ${result.byKey.length}, byValue groups: ${result.byValue.length}`,
    );

    console.log('\n// --- starter block for common-keys-allowlist.ts ---');
    console.log('export const COMMON_KEY_MAPPINGS: CommonKeyMapping[] = [');
    for (const g of result.byKey) {
      for (const src of g.sources) {
        console.log(
          `  // { from: { namespace: '${src.namespace}', key: '${src.key}' }, to: { key: '${g.key}' } }, // "${src.valueEn}"`,
        );
      }
    }
    console.log('];');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
