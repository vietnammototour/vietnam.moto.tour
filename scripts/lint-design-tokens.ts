import {readFileSync, readdirSync, type Dirent} from 'node:fs';
import {join, relative, extname} from 'node:path';

const ROOT = process.cwd();

const FORBIDDEN = [
  {
    regex: /#[0-9a-fA-F]{6}\b/,
    root: 'src/components',
    exts: ['.ts', '.tsx'],
    label: 'hardcoded hex color',
  },
  {
    regex: /\brounded-(sm|md|lg|xl|2xl|3xl|full)\b/,
    root: 'src/components',
    exts: ['.ts', '.tsx'],
    label: 'rounded utility',
  },
  {
    regex: /\bshadow-elevation\b/,
    root: 'src',
    exts: ['.ts', '.tsx', '.css'],
    label: 'shadow-elevation token',
  },
];

function walk(dir: string, exts: string[], out: string[]): void {
  const abs = join(ROOT, dir);
  let entries: Dirent<string>[];
  try {
    entries = readdirSync(abs, {withFileTypes: true});
  } catch {
    return;
  }
  for (const entry of entries) {
    const childRel = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(childRel, exts, out);
    } else if (entry.isFile() && exts.includes(extname(entry.name))) {
      out.push(childRel);
    }
  }
}

let failed = false;
for (const {regex, root, exts, label} of FORBIDDEN) {
  const files: string[] = [];
  walk(root, exts, files);
  const hits: string[] = [];
  for (const file of files) {
    const lines = readFileSync(join(ROOT, file), 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (regex.test(line)) hits.push(`${file}:${i + 1}: ${line.trim()}`);
    });
  }
  if (hits.length > 0) {
    console.error(`\n[design-lint] FAIL: ${label}\n${hits.join('\n')}`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log('[design-lint] PASS');
