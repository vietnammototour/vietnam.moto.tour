import {spawnSync} from 'node:child_process';

const FORBIDDEN = [
  {
    pattern: '#[0-9a-fA-F]{6}',
    glob: 'src/components/**/*.{ts,tsx}',
    label: 'hardcoded hex color',
  },
  {
    pattern: 'rounded-(sm|md|lg|xl|2xl|3xl|full)',
    glob: 'src/components/**/*.{ts,tsx}',
    label: 'rounded utility',
  },
  {
    pattern: 'shadow-elevation',
    glob: 'src/**/*.{ts,tsx,css}',
    label: 'shadow-elevation token',
  },
];

let failed = false;
for (const {pattern, glob, label} of FORBIDDEN) {
  const result = spawnSync('rg', ['-n', '--glob', glob, pattern], {
    encoding: 'utf8',
  });
  if (result.status === 0 && result.stdout.trim()) {
    console.error(`\n[design-lint] FAIL: ${label}\n${result.stdout}`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log('[design-lint] PASS');
