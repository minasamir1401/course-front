import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { studentSession } from './helpers/studentWorkspace';

test.use({ serviceWorkers: 'block' });
const certificates = Array.from({ length: 4 }, (_, index) => ({
  id: `certificate-${index}`, title: `شهادة التميز ${index + 1}`, message: null,
  fileName: `award-${index}.pdf`, mimeType: index === 1 ? 'image/png' : 'application/pdf', byteSize: 1024,
  createdAt: `2026-10-${21 - index}T10:00:00Z`, revokedAt: null,
  school: { name: 'مدرسة النجاح' }, student: { name: 'Student', username: 'student' }, issuer: { name: 'School admin' },
}));

for (const language of ['ar', 'en']) test(`certificates preview, view all and visible competition navigation ${language}`, async ({ page }) => {
  test.setTimeout(180000);
  await studentSession(page, language);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('**/api/auth/me', route => route.fulfill({ json: { authenticated: true, user: { id: 'me', role: 'STUDENT' } } }));
  const fileRequests: string[] = [];
  page.on('request', request => { if (/\/api\/certificates\/[^/]+\/file/.test(request.url())) fileRequests.push(request.url()); });
  await page.route('**/api/certificates?*', route => route.fulfill({ json: { items: certificates, total: 4 } }));
  const ar = language === 'ar';
  const section = page.getByRole('region', { name: ar ? 'شهاداتي' : 'My certificates', exact: true });
  for (const width of [320, 390, 768, 1024, 1191, 1280, 1536]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(section.getByRole('heading', { level: 3 })).toHaveCount(3, { timeout: 30000 });
    await expect(section).toContainText(ar ? 'إجمالي شهاداتك: ٤' : 'Total certificates: 4');
    await expect(section.getByRole('heading', { name: certificates[3].title })).toHaveCount(0);
    const nav = page.getByRole('navigation', { name: ar ? (width < 1024 ? 'التنقل السريع' : 'التنقل الرئيسي') : (width < 1024 ? 'Quick navigation' : 'Main navigation'), exact: true });
    const competition = nav.getByRole('link', { name: ar ? 'المسابقات' : 'Competitions', exact: true });
    await expect(competition).toBeVisible();
    await expect(competition).toHaveAttribute('href', '/competitions');
    const bounds = await competition.boundingBox();
    expect(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width).toBeTruthy();
    expect(await competition.locator('span').evaluate(element => element.getBoundingClientRect().width <= element.parentElement!.clientWidth)).toBeTruthy();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    if (width === 390 || width === 1191) {
      const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(audit.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
      await page.screenshot({ path: `../artifacts/dashboard-ui/certificates-${language}-${width}.png`, fullPage: true });
    }
  }
  expect(fileRequests).toEqual([]);
  await section.getByRole('link', { name: ar ? 'عرض الكل' : 'View all', exact: true }).click();
  await expect(page).toHaveURL(/\/certificates$/, { timeout: 30000 });
  await expect(page.getByRole('heading', { name: certificates[3].title, exact: true })).toBeVisible({ timeout: 30000 });
});

test('certificates failure is recoverable and independent of progress; revoked records stay hidden', async ({ page }) => {
  await studentSession(page);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  let mode: 'error' | 'empty' | 'items' = 'error';
  await page.route('**/api/certificates?*', route => mode === 'error' ? route.fulfill({ status: 503, json: { error: 'Unavailable' } }) : route.fulfill({ json: mode === 'empty' ? { items: [], total: 0 } : { items: [{ ...certificates[0], revokedAt: '2026-10-21T12:00:00Z' }, certificates[1]], total: 1 } }));
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  const section = page.getByRole('region', { name: 'My certificates', exact: true });
  await expect(section.getByRole('alert')).toContainText('Could not refresh certificates');
  await expect(section).not.toContainText('Total certificates:');
  await expect(page.locator('[class*="metricValue"]').nth(3)).toHaveText('20');
  await expect(section.getByRole('link', { name: 'View all', exact: true })).toBeVisible();
  mode = 'empty'; await section.getByRole('button', { name: 'Retry certificates' }).click();
  await expect(section).toContainText('Certificates sent by your school will appear here.');
  await expect(section).toContainText('Total certificates: 0');
  mode = 'items'; await page.getByRole('button', { name: 'Refresh progress', exact: true }).click();
  await expect(section.getByRole('heading', { level: 3 })).toHaveCount(1);
  await expect(section).not.toContainText(certificates[0].title);
  await expect(section).toContainText(certificates[1].title);
});
