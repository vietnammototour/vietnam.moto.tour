/**
 * Design verification harness — Stitch ↔ rendered-UI diff helper.
 *
 * Usage:
 *   pnpm design:verify                # snapshot DEFAULT_ROUTES at desktop + mobile
 *   pnpm design:verify -- /tours      # snapshot one path
 *   pnpm design:audit-page -- /admin  # alias, same script
 *
 * Output: PNG screenshots under .design-snapshots/ (gitignored).
 * Claude reads them via the Read tool and compares against DESIGN.md tokens.
 *
 * Standalone — does not require the Playwright MCP server. The MCP server is
 * the interactive path for Claude; this script is the deterministic batch path.
 */

import {chromium, type Browser, type Page} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.DESIGN_VERIFY_URL ?? 'http://localhost:3000';
const OUT_DIR = path.resolve(process.cwd(), '.design-snapshots');

const DEFAULT_ROUTES = [
  '/',
  '/tours',
  '/destinations',
  '/about',
  '/contact',
  '/login',
];

const VIEWPORTS = [
  {name: 'desktop', width: 1440, height: 900},
  {name: 'mobile', width: 390, height: 844},
];

const FREEZE_ANIMATIONS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    scroll-behavior: auto !important;
  }
`;

async function snapshot(
  browser: Browser,
  route: string,
  viewport: (typeof VIEWPORTS)[number],
) {
  const ctx = await browser.newContext({
    viewport: {width: viewport.width, height: viewport.height},
  });
  const page: Page = await ctx.newPage();
  const url = new URL(route, BASE_URL).toString();

  try {
    await page.goto(url, {waitUntil: 'networkidle', timeout: 30_000});
    await page.addStyleTag({content: FREEZE_ANIMATIONS});
    await page.waitForTimeout(250);

    const safeName =
      route.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'root';
    const file = path.join(OUT_DIR, `${safeName}-${viewport.name}.png`);
    await page.screenshot({path: file, fullPage: true, type: 'png'});
    console.log(
      `✓ ${viewport.name.padEnd(8)} ${route.padEnd(20)} → ${path.relative(process.cwd(), file)}`,
    );
  } catch (err) {
    console.error(`✗ ${viewport.name} ${route}: ${(err as Error).message}`);
  } finally {
    await ctx.close();
  }
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const routes = args.length > 0 ? args : DEFAULT_ROUTES;

  await mkdir(OUT_DIR, {recursive: true});
  const browser = await chromium.launch({headless: true});

  try {
    for (const route of routes) {
      for (const viewport of VIEWPORTS) {
        await snapshot(browser, route, viewport);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(
    `\nSnapshots written to ${path.relative(process.cwd(), OUT_DIR)}/`,
  );
  console.log(
    'Next step: Claude reads each PNG + diffs against DESIGN.md tokens.',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
