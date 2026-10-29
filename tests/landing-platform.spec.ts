import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { studentSession } from './helpers/studentWorkspace';

test('homepage language stays in sync across open tabs, reloads and navigation with mirrored layouts', async ({ page, context }) => {
  test.setTimeout(90000);
  await context.route('https://fonts.googleapis.com/**', route => route.abort());
  await context.route('**/api/ai/public/config', route => route.fulfill({ json: { enabled: false } }));
  await page.addInitScript(() => localStorage.setItem('klevro-install-dismissed', String(Date.now())));
  await page.setViewportSize({ width: 1191, height: 800 });
  await page.goto('/');
  const other = await context.newPage();
  await other.goto('/');
  await expect(other.locator('h1')).toContainText('رحلتك التعليمية');
  await page.getByRole('button', { name: 'التبديل للإنجليزية', exact: true }).click();
  for (const target of [page, other]) {
    await expect(target.locator('html')).toHaveAttribute('lang', 'en');
    await expect(target.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(target.locator('h1')).toContainText('Your Learning');
    await expect(target.locator('#features h2').first()).toHaveText('Interactive Lessons');
    await expect(target.locator('#account-help h2')).toHaveText('A clearer place to start.');
    const text = await target.locator('h1').boundingBox();
    const image = await target.getByRole('img', { name: 'Klevro neon identity in purple and blue' }).boundingBox();
    expect(text!.x).toBeLessThan(image!.x);
  }
  await page.reload();
  await expect(page.locator('h1')).toContainText('Your Learning');
  await page.getByRole('link', { name: 'Log in', exact: true }).first().click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator('#student-username')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('h1')).toContainText('Your Learning');
  await other.setViewportSize({ width: 390, height: 844 });
  await other.getByRole('button', { name: 'Switch to Arabic', exact: true }).click();
  await expect(page.locator('h1')).toContainText('رحلتك التعليمية');
  for (const target of [page, other]) {
    await expect(target.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(target.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(target.locator('#features h2').first()).toHaveText('دروس تفاعلية');
    expect(await target.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  const text = await page.locator('h1').boundingBox();
  const image = await page.getByRole('img', { name: 'شعار Klevro المضيء بالبنفسجي والأزرق' }).boundingBox();
  expect(text!.x).toBeGreaterThan(image!.x);
  await other.getByRole('button', { name: 'افتح القائمة', exact: true }).click();
  await expect(other.getByRole('dialog')).toContainText('اكتشف Klevro');
  await other.keyboard.press('Escape');
  await other.close();
});

test('homepage language and direction can change when browser preference storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const read = Storage.prototype.getItem, write = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) { if (key === 'lms_lang') throw new DOMException('Unavailable', 'SecurityError'); return read.call(this, key); };
    Storage.prototype.setItem = function (key, value) { if (key === 'lms_lang') throw new DOMException('Unavailable', 'SecurityError'); write.call(this, key, value); };
  });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'التبديل للإنجليزية', exact: true }).click();
  await expect(page.locator('h1')).toContainText('Your Learning');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await page.getByRole('button', { name: 'Switch to Arabic', exact: true }).click();
  await expect(page.locator('h1')).toContainText('رحلتك التعليمية');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

for (const language of ['ar', 'en']) test(`public landing matches platform and works responsively ${language}`, async ({ page }) => {
  test.setTimeout(120000);
  await page.addInitScript(lang => { localStorage.setItem('lms_lang', lang); localStorage.setItem('klevro-install-dismissed', String(Date.now())); }, language);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const width of [320, 390, 768, 1024, 1536]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText(language === 'ar' ? 'رحلتك التعليمية' : 'Your Learning');
    await expect(page.locator('html')).toHaveAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('#features article')).toHaveCount(4);
    await expect(page.locator('#features a, #features button, #features [role="button"]')).toHaveCount(0);
    await page.getByRole('tab').nth(1).click(); await expect(page.getByRole('tabpanel')).toContainText(language === 'ar' ? 'التقارير' : 'reports');
    await page.getByRole('tab').nth(2).click(); await expect(page.getByRole('tabpanel')).toContainText(language === 'ar' ? 'صلاحيات' : 'permissions');
    await page.locator('summary').first().click(); await expect(page.locator('details').first()).toHaveAttribute('open', '');
    if (width === 390 || width === 1536) {
      await page.getByRole('tab').first().click();
      const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(audit.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
      await page.evaluate(async () => { await Promise.all(Array.from(document.images).filter(img => getComputedStyle(img).display !== 'none').map(img => img.decode().catch(() => {}))); scrollTo(0, 0); });
      await page.screenshot({ path: `../artifacts/landing/landing-${language}-${width}.png`, fullPage: true });
      await page.locator('main > div').first().screenshot({ path: `../artifacts/landing/neon-home-${language}-${width}.png`, style: '[aria-label="افتح مساعد Klevro"], [aria-label="Open Klevro assistant"] { visibility:hidden!important; }' });
    }
    if (width === 320) {
      await page.evaluate(() => scrollTo(0, 0));
      const button = page.getByRole('button', { name: language === 'ar' ? 'افتح القائمة' : 'Open menu', exact: true });
      await button.click(); await expect(page.getByRole('dialog')).toBeVisible(); await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0); await expect(button).toBeFocused();
    }
  }
  expect(errors).toEqual([]);
  await page.getByRole('button', { name: language === 'ar' ? 'التبديل للإنجليزية' : 'Switch to Arabic', exact: true }).click();
  await expect(page.locator('h1')).toContainText(language === 'ar' ? 'Your Learning' : 'رحلتك التعليمية');
});

test('public page renders without JavaScript and has honest SEO endpoints', async ({ browser, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false }); const page = await context.newPage();
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' }); await expect(page.locator('h1')).toContainText('رحلتك التعليمية'); await expect(page.locator('#features article')).toHaveCount(4);
  await expect(page).toHaveTitle('Klevro | منصة التعلم والاختبارات والمهارات');
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href'); expect(new URL(canonical || '').href).toBe('http://localhost:3000/');
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() || '{}'); expect(schema['@graph'].map((item: any) => item['@type'])).toEqual(['Organization', 'WebSite', 'WebApplication']); expect(JSON.stringify(schema)).not.toMatch(/aggregateRating|reviewCount|platform\.tech/);
  const sitemap = await request.get('/sitemap.xml'); expect(sitemap.ok()).toBe(true); expect(await sitemap.text()).toContain('<loc>http://localhost:3000/</loc>'); expect(await sitemap.text()).not.toContain('/dashboard');
  const robots = await request.get('/robots.txt'); expect(await robots.text()).toContain('Disallow: /api/');
  const image = await request.get('/opengraph-image'); expect(image.ok()).toBe(true); expect(image.headers()['content-type']).toContain('image/png');
  const png = await image.body(); expect(png.readUInt32BE(16)).toBe(1200); expect(png.readUInt32BE(20)).toBe(630);
  await context.close();
});

test('failed student requests show errors, without substitute grades or fake empty records', async ({ page }) => {
  test.setTimeout(90000); await studentSession(page, 'en'); await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('**/api/**', route => route.fulfill({ status: 500, json: { error: 'Data unavailable' } }));
  for (const path of ['/dashboard', '/courses', '/exams', '/activities', '/calendar', '/reports']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toContainText(/Could not|Unable|unavailable/i);
    await expect(page.locator('main')).not.toContainText(/No courses assigned|No published exams yet|No published events|No attempts in this period/);
    await expect(page.locator('main')).not.toContainText('👨');
    await expect(page.locator('main [class*="metricValue"]')).toHaveCount(0);
    await expect(page.locator('main [class*="metric"] strong').filter({hasText:/^\d/})).toHaveCount(0);
  }
});

test('student pages do not show invented values when all records are empty', async ({ page }) => {
  test.setTimeout(90000); await studentSession(page, 'en'); await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('**/api/student/stats', route => route.fulfill({ json: { name: 'Real record', overallCourseProgress: 0, avgScore: null, passRate: null, totalExams: 0, xp: 0, courseProgresses: [], upcomingTasks: [] } }));
  await page.route('**/api/exams', route => route.fulfill({ json: [] }));
  await page.route('**/api/workspace/calendar*', route => route.fulfill({ json: { events: [] } }));
  await page.route('**/api/reports/overview*', route => route.fulfill({ json: { summary: { totalAttempts: 0, selectedAttempts: 0, averageScore: null, passRate: null }, timeline: [], skills: [], questions: [], modules: [], subExams: [], students: [], pagination: { pages: 0, total: 0 } } }));
  for (const [path, empty] of [['/dashboard', 'No courses assigned yet'], ['/courses', 'No courses assigned yet'], ['/exams', 'No published exams yet'], ['/activities', 'Your next activities start here'], ['/calendar', 'No published events'], ['/reports', 'No attempts in this period']]) {
    await page.goto(path, { waitUntil: 'domcontentloaded' }); await expect(page.locator('main')).toContainText(empty);
    await expect(page.locator('a[class*="avatar"]')).toHaveCount(0); await expect(page.locator('main')).not.toContainText('👨');
    if (path === '/dashboard') { await expect(page.locator('[class*="metricValue"]').nth(1)).toHaveText('—'); await expect(page.locator('[class*="metricValue"]').nth(3)).toHaveText('0'); }
    if (path === '/courses') await expect(page.locator('[class*="metric"] strong').nth(1)).toHaveText('—');
  }
});
