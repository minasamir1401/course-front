import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { studentSession } from './helpers/studentWorkspace';
const certificate = { id: 'cert', title: 'شهادة التميز الدراسي', message: 'أحسنت، واصل تقدمك.', fileName: 'award.pdf', mimeType: 'application/pdf', byteSize: 14, createdAt: '2026-10-21T10:00:00Z', revokedAt: null, student: { name: 'Student', username: 'student' }, school: { name: 'School' }, issuer: { name: 'Admin' } };
for (const language of ['ar', 'en']) test(`student certificates and notifications are responsive and bilingual ${language}`, async ({ page }) => {
  test.setTimeout(120000); await studentSession(page, language); await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.addInitScript(() => localStorage.setItem('klevro-install-dismissed', String(Date.now())));
  await page.route('**/api/auth/me', route => route.fulfill({ json: { authenticated: true, user: { id: 'me', role: 'STUDENT' } } }));
  await page.route('**/api/certificates?*', route => route.fulfill({ json: { items: [certificate], total: 1 } }));
  await page.route('**/api/certificates/cert/file', route => route.fulfill({ contentType: 'application/pdf', body: '%PDF-1.4\n%%EOF' }));
  let read = false;
  await page.route('**/api/notifications**', route => {
    if (route.request().method() === 'PATCH') { read = true; return route.fulfill({ json: { success: true } }); }
    return route.fulfill({ json: { items: [{ id: 'notice', kind: 'CERTIFICATE', titleAr: 'شهادة جديدة من مدرستك', titleEn: 'A new certificate from your school', body: certificate.title, href: '/certificates', readAt: read ? '2026-10-21T11:00:00Z' : null, createdAt: '2026-10-21T10:00:00Z' }], total: 1, unread: read ? 0 : 1 } });
  });
  await page.route('**/api/push/config', route => route.fulfill({ json: { enabled: false } }));
  for (const width of [320, 390, 768, 1024, 1536]) {
    await page.setViewportSize({ width, height: 920 }); await page.goto('/certificates');
    await expect(page.getByRole('heading', { name: certificate.title, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('html')).toHaveAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    if (width === 390 || width === 1536) { const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); expect(audit.violations.map(v => v.id)).toEqual([]); await page.screenshot({ path: `../artifacts/platform/certificates-${language}-${width}.png`, fullPage: true }); }
  }
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: language === 'ar' ? 'تحميل الشهادة' : 'Download certificate', exact: true }).click(); expect((await download).suggestedFilename()).toBe('award.pdf');
  await page.goto('/notifications'); await expect(page.getByRole('heading', { name: language === 'ar' ? 'شهادة جديدة من مدرستك' : 'A new certificate from your school', exact: true })).toBeVisible();
  await page.getByRole('button', { name: language === 'ar' ? 'قراءة الكل' : 'Mark all read', exact: true }).click(); await expect.poll(() => read).toBe(true);
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); expect(audit.violations.map(v => ({ id: v.id, target: v.nodes.map(n => n.target) }))).toEqual([]);
  await page.screenshot({ path: `../artifacts/platform/notifications-${language}.png`, fullPage: true });
});
test('student can preview and download a private lossless WebP certificate', async ({ page }) => {
  test.setTimeout(60000); await studentSession(page, 'en'); await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.addInitScript(() => localStorage.setItem('klevro-install-dismissed', String(Date.now())));
  const bytes = await require('../../back/node_modules/sharp')({ create: { width: 80, height: 50, channels: 3, background: '#5028e8' } }).webp({ lossless: true }).toBuffer();
  const item = { ...certificate, mimeType: 'image/webp', fileName: 'award.webp', byteSize: bytes.length };
  await page.route('**/api/auth/me', route => route.fulfill({ json: { authenticated: true, user: { id: 'me', role: 'STUDENT' } } }));
  await page.route('**/api/certificates?*', route => route.fulfill({ json: { items: [item], total: 1 } }));
  await page.route('**/api/certificates/cert/file', route => route.fulfill({ contentType: 'image/webp', body: bytes }));
  await page.goto('/certificates'); await page.getByRole('button', { name: 'Preview', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: certificate.title, exact: true }); await expect(dialog).toBeVisible();
  const image = dialog.getByRole('img', { name: certificate.title, exact: true }); await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth === 80)).toBe(true);
  await page.getByRole('button', { name: 'Close preview', exact: true }).click(); await expect(dialog).toBeHidden();
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download certificate', exact: true }).click(); expect((await download).suggestedFilename()).toBe('award.webp');
});

test('PWA manifest, service worker, install invitation and private offline boundary', async ({ page, context }) => {
  test.setTimeout(60000); await page.route('https://fonts.googleapis.com/**', route => route.abort()); await page.goto('/');
  await expect(page.getByRole('heading', { name: 'منصتك أقرب… حمّل التطبيق' })).toBeVisible(); await page.getByRole('button', { name: 'حمّل التطبيق', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'قائمة المتصفح' })).toBeVisible();
  const manifest = await (await page.request.get('/manifest.webmanifest')).json(); expect(manifest.display).toBe('standalone'); expect(manifest.icons).toHaveLength(3); expect(manifest.start_url).toBe('/dashboard');
  const result = await page.evaluate(async () => { await navigator.serviceWorker.ready; const name = (await caches.keys()).find(key => key.startsWith('klevro-public-offline-')); if (!name) throw new Error('Offline cache is missing'); const cache = await caches.open(name); return (await cache.keys()).map(r => new URL(r.url).pathname); });
  expect(result.sort()).toEqual(['/offline.html', '/pwa/klevro-v2-192.png']);
  await context.setOffline(true); await page.goto('/notifications'); await expect(page.getByRole('heading', { name: 'نرجع نكمل أول ما تتصل' })).toBeVisible(); await context.setOffline(false);
});
test('device push asks permission only on click, saves the subscription and can be disabled', async ({ page }) => {
  test.setTimeout(60000); await studentSession(page, 'en'); await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('klevro-install-dismissed', String(Date.now()));
    (window as unknown as { permissionCalls: number }).permissionCalls = 0;
    Object.defineProperty(Notification, 'requestPermission', { configurable: true, value: async () => { (window as unknown as { permissionCalls: number }).permissionCalls++; return 'granted'; } });
    PushManager.prototype.getSubscription = async () => null;
    PushManager.prototype.subscribe = async () => ({ endpoint: 'https://fcm.googleapis.com/fcm/send/fixture', toJSON: () => ({ endpoint: 'https://fcm.googleapis.com/fcm/send/fixture', keys: { p256dh: 'a'.repeat(87), auth: 'b'.repeat(22) } }), unsubscribe: async () => true }) as unknown as PushSubscription;
  });
  const publicKey = require('../../back/node_modules/web-push').generateVAPIDKeys().publicKey;
  let saved = false; let removed = false;
  await page.route('**/api/notifications**', route => route.fulfill({ json: { items: [], total: 0, unread: 0 } }));
  await page.route('**/api/push/config', route => route.fulfill({ json: { enabled: true, publicKey } }));
  await page.route('**/api/push/subscriptions', route => { if (route.request().method() === 'POST') { expect(route.request().postDataJSON().language).toBe('en'); saved = true; } else removed = true; return route.fulfill({ json: { success: true } }); });
  await page.goto('/notifications'); const enable = page.getByRole('button', { name: 'Enable notifications', exact: true }); await expect(enable).toBeEnabled(); expect(await page.evaluate(() => (window as unknown as { permissionCalls: number }).permissionCalls)).toBe(0);
  await enable.click(); await expect.poll(() => saved).toBe(true); expect(await page.evaluate(() => (window as unknown as { permissionCalls: number }).permissionCalls)).toBe(1);
  // Return the active subscription for the off action.
  await page.evaluate(() => { PushManager.prototype.getSubscription = async () => ({ endpoint: 'https://fcm.googleapis.com/fcm/send/fixture', unsubscribe: async () => true }) as PushSubscription; });
  await page.getByRole('button', { name: 'Turn off on this device', exact: true }).click(); await expect.poll(() => removed).toBe(true); await expect(enable).toBeEnabled();
});
