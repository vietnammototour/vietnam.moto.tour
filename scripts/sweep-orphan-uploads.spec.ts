/**
 * @jest-environment node
 */
jest.mock('@/lib/prisma', () => ({prisma: {}}));
jest.mock('@/lib/upload-dir', () => ({getUploadDir: () => '/tmp/uploads'}));

import fs from 'fs';
import path from 'path';
import os from 'os';
import {sweepOrphans} from './sweep-orphan-uploads';

const NOW = Date.now();
const TEN_DAYS_AGO = NOW - 10 * 24 * 3600 * 1000;

it('removes old orphans, keeps recent orphans, keeps referenced files', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-'));
  const referenced = path.join(dir, 'tours/t1/card.aaaaaaaa.webp');
  const oldOrphan = path.join(dir, 'tours/t1/card.bbbbbbbb.webp');
  const newOrphan = path.join(dir, 'tours/t1/card.cccccccc.webp');
  for (const f of [referenced, oldOrphan, newOrphan]) {
    fs.mkdirSync(path.dirname(f), {recursive: true});
    fs.writeFileSync(f, 'x');
  }
  fs.utimesSync(oldOrphan, TEN_DAYS_AGO / 1000, TEN_DAYS_AGO / 1000);

  await sweepOrphans({
    rootDir: dir,
    referencedHashes: new Set(['aaaaaaaa']),
    olderThanMs: 7 * 24 * 3600 * 1000,
  });

  expect(fs.existsSync(referenced)).toBe(true);
  expect(fs.existsSync(oldOrphan)).toBe(false);
  expect(fs.existsSync(newOrphan)).toBe(true);
});
