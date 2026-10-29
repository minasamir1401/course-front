import { serverSession } from './helpers/serverSession';
import { test, expect, Page } from '@playwright/test';
import { studentSession, exam } from './helpers/studentWorkspace';

const exams = Array.from({ length: 5 }, (_, index) => ({ ...exam, id: `assessment-${index}`, title: `اختبار الرياضيات ${index + 1}`, titleEn: `Mathematics assessment ${index + 1}`, subjects: 'Mathematics', schoolId: 'school', modules: [] }));
async function admin(page: Page, role: string, language: string) {
  const prefix = role === 'SUPER_ADMIN' ? 'super-admin' : 'school-admin';
  const user = { id: 'admin', name: 'Author', role, schoolId: 'school', status: 'ACTIVE' };
  await serverSession(page, role);
  await page.addInitScript(({ prefix, user, language }) => {
    const key = prefix.replace('-', '_');
    localStorage.setItem(`${key}_user`, JSON.stringify(user));
    localStorage.setItem(`${key}_token`, 'cookie_auth');
    localStorage.setItem(`${key}_token_expires_at`, String(Date.now() + 86400000));
    localStorage.setItem('lms_lang', language);
    Object.defineProperty(navigator, 'standalone', { value: true });
  }, { prefix, user, language });
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user } });
    if (path === '/api/exams') return route.fulfill({ json: exams });
    if (path.includes('/schools')) return route.fulfill({ json: [{ id: 'school', name: 'School' }] });
    return route.fulfill({ json: path.includes('/metadata') ? { domains: [], standards: [], indicators: [], outcomes: [] } : [] });
  });
  return prefix;
}

for (const role of ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']) for (const language of ['ar', 'en']) {
  test(`${role} ${language}: installed app back button preserves the previous URL after navigation and refresh`, async ({ page }) => {
    test.setTimeout(120000);
    const prefix = await admin(page, role, language);
    const back = page.getByRole('button', { name: language === 'ar' ? 'الرجوع للصفحة السابقة' : 'Back to previous page', exact: true });
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${prefix}/exams?source=app&tab=saved`);
      await expect(page.locator('[data-exam-artwork]')).toHaveCount(5);
      const fingerprints = await page.locator('[data-exam-artwork]').evaluateAll(elements => elements.map(e => e.getAttribute('data-artwork-fingerprint')));
      expect(new Set(fingerprints).size).toBe(5);
      await page.getByRole('link', { name: language === 'ar' ? 'إنشاء Module اختبار جديد' : 'Create New Exam Module', exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/${prefix}/exams/new\\?mode=module$`));
      await expect(back).toBeVisible();
      const bounds = (await back.boundingBox())!;
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      await page.reload();
      await back.click();
      await expect(page).toHaveURL(new RegExp(`/${prefix}/exams\\?source=app&tab=saved$`));
      if (role === 'SUPER_ADMIN') await page.screenshot({ path: `../artifacts/exam-artwork/admin-${language}-${width}.png`, fullPage: true });
    }
    await page.goto('/settings');
    await expect(back).toBeVisible();
    await back.click();
    await expect(page).toHaveURL(new RegExp(`/${prefix}/exams\\?source=app&tab=saved$`));
  });
}

test('a directly opened admin app window returns to its exam list', async ({ page }) => {
  await admin(page, 'SCHOOL_ADMIN', 'ar');
  await page.goto('/school-admin/exams/new?mode=module');
  await page.getByRole('button', { name: 'الرجوع للصفحة السابقة', exact: true }).click();
  await expect(page).toHaveURL(/\/school-admin\/exams$/);
});

test('each exam keeps the same artwork across ordering, language, details and preview', async ({ page }) => {
  test.setTimeout(90000);
  await studentSession(page, 'en');
  await page.addInitScript(() => localStorage.setItem('klevro-install-dismissed', String(Date.now())));
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  let items: Array<(typeof exams)[number] & { coverImage?: string }> = [...exams];
  await page.route('**/api/exams', r => r.fulfill({ json: items }));
  await page.route('**/api/exams/assessment-0*', r => r.fulfill({ json: exams[0] }));
  await page.goto('/exams');
  const artwork = page.locator('[data-exam-artwork="assessment-0"]');
  await expect(artwork).toBeVisible();
  const signature = async () => ({ fingerprint: await artwork.first().getAttribute('data-artwork-fingerprint'), src: await artwork.first().locator('img').getAttribute('src'), style: await artwork.first().getAttribute('style') });
  const first = await signature();
  items.reverse();
  await page.reload();
  expect(await signature()).toEqual(first);
  await page.getByRole('button', { name: 'Switch to Arabic', exact: true }).click();
  expect(await signature()).toEqual(first);
  await page.goto('/exams/assessment-0/details');
  await expect(artwork.first()).toBeVisible();
  expect(await signature()).toEqual(first);
  await page.goto('/exams/assessment-0?preview=true');
  await expect(artwork).toBeVisible();
  expect(await signature()).toEqual(first);
  await page.goto('/exams');
  await page.screenshot({ path: '../artifacts/exam-artwork/distinct-exam-covers.png', fullPage: true });
  items = [{ ...exams[0], coverImage: '/klevro/subjects/arabic.webp' }];
  await page.reload();
  await expect(artwork).toHaveAttribute('data-custom-cover', 'true');
  await expect(artwork.locator('img')).toHaveAttribute('src', /arabic/);
});
