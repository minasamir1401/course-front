import { test, expect, type Page } from '@playwright/test';
import { serverSession } from './helpers/serverSession';
import path from 'node:path';
import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const filename = `ui-backup-${randomUUID().slice(0, 8)}-نسخة احتياطية ${'للدروس والمقررات والاختبارات '.repeat(5)}& الطلاب.json`;
const backend = path.resolve(__dirname, '../../back');
const configured = createRequire(path.join(backend, 'package.json'))('dotenv').parse(readFileSync(path.join(backend, '.env'))).BACKUPS_DIR;
const backupDirectory = path.resolve(backend, configured || 'private/backups');
if (path.relative(backend, backupDirectory).startsWith('..')) throw new Error('Backup download fixture must stay in the local backend workspace');
async function admin(page: Page, language: string) {
  await serverSession(page, 'SUPER_ADMIN');
  await page.addInitScript(lang => { localStorage.setItem('lms_lang', lang); localStorage.setItem('klevro-install-dismissed', String(Date.now())); }, language);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith('/api/admin/backup/download/')) return route.continue();
    if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user: { id: 'admin', role: 'SUPER_ADMIN', name: 'Backup reviewer' } } });
    if (path === '/api/ai/public/config') return route.fulfill({ json: { enabled: false } });
    return route.fulfill({ json: path.includes('schools') ? [] : {} });
  });
}

for (const language of ['ar', 'en']) test(`backups fit small screens and download only after an explicit click ${language}`, async ({ page }) => {
  test.setTimeout(90000);
  const fixture = path.join(backupDirectory, filename);
  await fs.mkdir(backupDirectory, { recursive: true });
  await fs.writeFile(fixture, JSON.stringify({ purpose: 'UI download fixture only' }), { flag: 'wx' });
  try {
  await admin(page, language);
  const ar = language === 'ar';
  const files = [
    { name: filename, size: 102400, createdAt: '2026-10-29T12:00:00Z' },
    { name: 'all-backups-2026-10-29.zip', size: 1024000, createdAt: '2026-10-29T10:00:00Z', type: 'ARCHIVE' },
  ];
  let reads = 0; const downloads: string[] = []; const writes: string[] = [];
  page.on('download', download => downloads.push(download.url()));
  page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
  await page.route('**/api/admin/backup/list', route => { reads++; return route.fulfill({ json: { backups: files } }); });
  await page.goto('/super-admin/backups');
  await expect(page.getByRole('heading', { name: filename, exact: true })).toBeVisible();
  // The former page started a download 1200ms after receiving the list.
  await page.waitForTimeout(1500);
  expect(downloads).toEqual([]); expect(writes).toEqual([]);
  for (const width of [320, 390, 768, 1024, 1536]) {
    await page.setViewportSize({ width, height: 900 });
    await page.reload();
    await expect(page.getByRole('heading', { name: filename, exact: true })).toBeVisible();
    await page.evaluate(() => scrollTo(0, 0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const clipped = await page.locator('main button, main h1, main h4').evaluateAll(elements => elements.filter(element => element.getClientRects().length).filter(element => { const bounds = element.getBoundingClientRect(); return bounds.left < -1 || bounds.right > innerWidth + 1; }).map(element => element.textContent));
    expect(clipped).toEqual([]);
    if (width === 390 || width === 1536) await page.screenshot({ path: `../artifacts/backups/backups-${language}-${width}.png`, fullPage: true });
  }
  const previousReads = reads;
  await page.getByRole('button', { name: ar ? 'تحديث القائمة' : 'Refresh List', exact: true }).click();
  await expect.poll(() => reads).toBeGreaterThan(previousReads);
  await page.waitForTimeout(1500);
  expect(downloads).toEqual([]); expect(writes).toEqual([]);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: `${ar ? 'تحميل ملف النسخة' : 'Download file'}: ${filename}`, exact: true }).click();
  const file = await download;
  expect(await file.failure(), file.url()).toBeNull();
  expect(JSON.parse(await fs.readFile((await file.path())!, 'utf8'))).toEqual({ purpose: 'UI download fixture only' });
  expect(downloads).toHaveLength(1);
  const url = new URL(downloads[0]);
  expect(decodeURIComponent(url.pathname)).toBe(`/api/admin/backup/download/${filename}`);
  expect(url.searchParams.has('token')).toBe(false);
  await page.reload();
  await expect(page.getByRole('heading', { name: filename, exact: true })).toBeVisible();
  await page.waitForTimeout(1500);
  expect(downloads).toHaveLength(1); expect(writes).toEqual([]);
  } finally { await fs.unlink(fixture); }
});

test('backup list failure offers retry without claiming that backups are empty', async ({ page }) => {
  await admin(page, 'en');
  let failed = true;
  await page.route('**/api/admin/backup/list', route => route.fulfill({ status: failed ? 503 : 200, json: failed ? { error: 'Unavailable' } : { backups: [] } }));
  await page.goto('/super-admin/backups');
  await expect(page.getByRole('alert').filter({ hasText: 'Unable to load the backup list.' })).toBeVisible();
  await expect(page.getByText('No backups found', { exact: true })).toHaveCount(0);
  failed = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByText('No backups found', { exact: true })).toBeVisible();
});
