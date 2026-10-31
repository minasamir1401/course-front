import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

test('installed-app metadata uses the supplied logo through new URLs and retires its old cache', async ({ page }) => {
  test.setTimeout(90000);
  const sharp = require('sharp');
  const source = path.resolve(__dirname, '../public/klevro/brand/klevro-logo.jpg');
  const response = await page.request.get('/manifest.webmanifest');
  expect(response.ok()).toBe(true);
  expect(response.headers()['cache-control']).toContain('no-cache');
  const manifest = await response.json();
  // Preserve the identity of an already installed application.
  expect(manifest.id).toBe('/'); expect(manifest.scope).toBe('/');
  expect(manifest.start_url).toBe('/dashboard');
  expect(manifest.icons.map((icon: { src: string }) => icon.src)).toEqual([
    '/pwa/klevro-v2-192.png', '/pwa/klevro-v2-512.png', '/pwa/klevro-v2-maskable-512.png',
  ]);
  for (const icon of manifest.icons) {
    const asset = await page.request.get(icon.src); expect(asset.ok()).toBe(true);
    const metadata = await sharp(await asset.body()).metadata();
    const size = Number(icon.sizes.split('x')[0]);
    expect([metadata.width, metadata.height]).toEqual([size, size]);
    expect((await sharp(await asset.body()).stats()).isOpaque).toBe(true);
  }
  // Pixel comparison prevents a placeholder/old logo from passing by filename alone.
  const expected = await sharp(source).rotate().resize(512, 512, { fit: 'contain', background: '#fff' }).flatten({ background: '#fff' }).raw().toBuffer();
  const actual = await sharp(await (await page.request.get(manifest.icons[1].src)).body()).raw().toBuffer();
  expect(actual.equals(expected)).toBe(true);

  // Seed an old installation before visiting the app that registers the new worker.
  await page.goto('/offline.html');
  await page.evaluate(async () => {
    const cache = await caches.open('klevro-public-offline-v3');
    await cache.put('/pwa/icon-192.png', new Response('old installed icon'));
  });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.addInitScript(() => localStorage.setItem('klevro-install-dismissed', String(Date.now())));
  await page.goto('/');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/pwa/klevro-v2-apple-180.png');
  await expect(page.locator('link[rel="icon"][type="image/png"]')).toHaveAttribute('href', '/pwa/klevro-v2-192.png');
  expect(await page.locator('link[href*="icon.jpeg"], link[href*="apple-icon.jpeg"]').count()).toBe(0);
  await expect.poll(() => page.evaluate(async () => (await caches.keys()).filter(key => key.startsWith('klevro-public-offline-')))).toEqual(['klevro-public-offline-v4']);
  const cached = await page.evaluate(async () => {
    const cache = await caches.open('klevro-public-offline-v4');
    return (await cache.keys()).map(request => new URL(request.url).pathname).sort();
  });
  expect(cached).toEqual(['/offline.html', '/pwa/klevro-v2-192.png']);
  const offline = await fs.readFile(path.resolve(__dirname, '../public/offline.html'), 'utf8');
  expect(offline).toContain('/pwa/klevro-v2-192.png');
  // The homepage keeps its existing separate neon artwork.
  await expect(page.getByRole('img', { name: 'شعار Klevro المضيء بالبنفسجي والأزرق', exact: true })).toHaveAttribute('src', /klevro-neon/);
});
