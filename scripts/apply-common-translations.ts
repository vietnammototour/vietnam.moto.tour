import * as fs from 'fs';
import * as path from 'path';
import {createPrisma} from './lib/translation-db';
import {COMMON_KEY_MAPPINGS, CommonKeyMapping} from './common-keys-allowlist';
import {planDbOperations, DbOp} from './lib/apply-db';
import {
  rewriteSource,
  CodemodMapping,
  Change,
  ManualEntry,
} from './lib/codemod';
import type {TranslationRow} from './lib/scan';

type CliFlags = {apply: boolean; forceOverwrite: boolean};

function parseFlags(argv: string[]): CliFlags {
  return {
    apply: argv.includes('--apply'),
    forceOverwrite: argv.includes('--force-overwrite'),
  };
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

type FileResult = {file: string; changes: Change[]; manual: ManualEntry[]};

function runCodemod(
  srcRoot: string,
  mappings: CommonKeyMapping[],
  apply: boolean,
): FileResult[] {
  const cmMappings: CodemodMapping[] = mappings.map((m) => ({
    fromNamespace: m.from.namespace,
    fromKey: m.from.key,
    toKey: m.to.key,
  }));
  const results: FileResult[] = [];
  for (const file of walk(srcRoot)) {
    const input = fs.readFileSync(file, 'utf-8');
    const {output, changes, manual} = rewriteSource(file, input, cmMappings);
    if (changes.length === 0 && manual.length === 0) continue;
    results.push({file, changes, manual});
    if (apply && output !== input) fs.writeFileSync(file, output);
  }
  return results;
}

function writeReport(results: FileResult[], reportPath: string) {
  const lines: string[] = ['# Migration Report', ''];
  const withChanges = results.filter((r) => r.changes.length > 0);
  const withManual = results.filter((r) => r.manual.length > 0);

  lines.push(`## Rewritten (${withChanges.length} files)`, '');
  for (const r of withChanges) {
    lines.push(`### ${path.relative(process.cwd(), r.file)}`);
    for (const c of r.changes) {
      lines.push(
        `- \`${c.fromNamespace}.${c.fromKey}\` -> \`common.${c.toKey}\` (alias \`${c.alias}\`)`,
      );
    }
    lines.push('');
  }

  lines.push(`## Manual review (${withManual.length} files)`, '');
  for (const r of withManual) {
    lines.push(`### ${path.relative(process.cwd(), r.file)}`);
    for (const m of r.manual) lines.push(`- ${m.reason}`);
    lines.push('');
  }

  fs.writeFileSync(reportPath, lines.join('\n'));
}

async function execDb(prisma: ReturnType<typeof createPrisma>, ops: DbOp[]) {
  await prisma.$transaction(async (tx) => {
    for (const op of ops) {
      if (op.type === 'upsert') {
        await tx.translation.upsert({
          where: {namespace_key: {namespace: op.namespace, key: op.key}},
          create: {
            namespace: op.namespace,
            key: op.key,
            valueVi: op.valueVi,
            valueEn: op.valueEn,
          },
          update: {valueVi: op.valueVi, valueEn: op.valueEn},
        });
      } else {
        await tx.translation.deleteMany({
          where: {namespace: op.namespace, key: op.key},
        });
      }
    }
  });
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  if (COMMON_KEY_MAPPINGS.length === 0) {
    console.log('Allowlist is empty. Nothing to do.');
    return;
  }

  const prisma = createPrisma();
  try {
    const rows = (await prisma.translation.findMany({
      select: {namespace: true, key: true, valueVi: true, valueEn: true},
    })) as TranslationRow[];

    const dbPlan = planDbOperations(COMMON_KEY_MAPPINGS, rows, {
      forceOverwrite: flags.forceOverwrite,
    });

    if (dbPlan.errors.length > 0) {
      console.error('DB plan errors. Refusing to proceed:');
      for (const e of dbPlan.errors) console.error('  - ' + e);
      process.exit(1);
    }

    const srcRoot = path.join(__dirname, '..', 'src');
    const fileResults = runCodemod(srcRoot, COMMON_KEY_MAPPINGS, flags.apply);
    const reportPath = path.join(__dirname, 'migration-report.md');
    writeReport(fileResults, reportPath);

    console.log(
      `Code rewrites: ${fileResults.reduce((n, r) => n + r.changes.length, 0)}`,
    );
    console.log(
      `Manual entries: ${fileResults.reduce((n, r) => n + r.manual.length, 0)}`,
    );
    console.log(`DB ops: ${dbPlan.ops.length}`);
    console.log(`Report: ${reportPath}`);

    if (!flags.apply) {
      console.log('Dry run. Re-run with --apply to write files and mutate DB.');
      return;
    }

    await execDb(prisma, dbPlan.ops);
    console.log('Applied.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
