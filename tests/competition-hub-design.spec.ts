import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { studentSession } from './helpers/studentWorkspace';

test.use({ serviceWorkers: 'block' });
const policy = { enabled: true, sound: true, motion: true, leaderboard: true };
const base = { mode: 'SELF_PACED', status: 'OPEN', teams: false, questionCount: 8, participants: 12, capacity: 100, schoolName: 'مدرسة النجاح', sourceKind: 'COURSE', description: 'تحدٍّ جديد للتعلّم مع زملائك' };
const rooms = [
  { ...base, id: 'math', title: 'تحدي الرياضيات', titleEn: 'Math challenge', prizeLabel: 'شهادة التميز' },
  { ...base, id: 'live', title: 'تحدي العلوم المباشر', titleEn: 'Live science challenge', mode: 'LIVE', teams: true, sourceKind: 'EXAM' },
  { ...base, id: 'future', title: 'تحدي القراءة القادم', titleEn: 'Upcoming reading challenge', opensAt: '2099-10-21T12:00:00Z', closesAt: '2099-10-22T12:00:00Z', sourceKind: 'ACTIVITY' },
  { ...base, id: 'done', title: 'تحدي الإنجاز', titleEn: 'Completed challenge', status: 'FINISHED', myEntry: { score: 280, finishedAt: '2026-10-20T12:00:00Z' } },
  { ...base, id: 'full', title: 'تحدي الأعداد', titleEn: 'Number challenge', participants: 100 },
];
for (const language of ['ar', 'en']) test('modern competition hub is responsive, searchable and saves actual preferences ' + language, async ({ page }) => {
  test.setTimeout(180000);
  const ar = language === 'ar';
  await studentSession(page, language);
  await page.addInitScript(() => localStorage.setItem('klevro-install-dismissed', String(Date.now())));
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('**/api/auth/me', route => route.fulfill({ json: { authenticated: true, user: { id: 'me', role: 'STUDENT' } } }));
  let saved: unknown;
  await page.route('**/api/competitions**', route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/profile')) {
      if (route.request().method() === 'PUT') saved = route.request().postDataJSON();
      return route.fulfill({ json: { profile: { sound: false, motion: true, publicName: false }, policy } });
    }
    if (url.pathname.endsWith('/leaderboard')) return route.fulfill({ json: { enabled: true, items: [{ rank: 1, name: 'آدم', school: 'مدرسة النجاح', score: 280, competitions: 1, correct: 8, isMe: true }] } });
    const source = url.searchParams.get('sourceKind');
    return route.fulfill({ json: { items: source ? rooms.filter(room => room.sourceKind === source) : rooms, policy } });
  });
  const challenges = page.getByRole('region', { name: ar ? 'اختر تحدّيك القادم' : 'Choose your next challenge', exact: true });
  for (const width of [320, 390, 768, 1024, 1191, 1536]) {
    await page.setViewportSize({ width, height: 920 });
    await page.goto('/competitions', { waitUntil: 'domcontentloaded' });
    await expect(challenges.getByRole('article')).toHaveCount(5, { timeout: 30000 });
    const summary = page.getByRole('region', { name: ar ? 'ملخص المسابقات في التصنيف المختار' : 'Competition summary for the selected category' });
    await expect(summary.locator('strong')).toHaveText(ar ? ['٥', '١', '١'] : ['5', '1', '1']);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(challenges.getByRole('link', { name: ar ? 'النتائج والترتيب' : 'Results & rankings', exact: true })).toHaveAttribute('href', '/competitions/done');
    if (width === 390 || width === 1536) {
      const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(audit.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
      await page.screenshot({ path: '../artifacts/competitions/hub-' + language + '-' + width + '.png', fullPage: true });
    }
  }
  await page.getByRole('searchbox', { name: ar ? 'ابحث عن مسابقة' : 'Search competitions', exact: true }).fill('الرياضيات');
  await expect(challenges.getByRole('article')).toHaveCount(1);
  await page.getByRole('button', { name: ar ? 'مسح البحث' : 'Clear search', exact: true }).click();
  await page.getByRole('combobox', { name: ar ? 'حالة المسابقة' : 'Competition status', exact: true }).selectOption('upcoming');
  await expect(challenges.getByRole('article')).toHaveCount(1);
  await expect(challenges.getByRole('heading', { name: ar ? 'تحدي القراءة القادم' : 'Upcoming reading challenge', exact: true })).toBeVisible();
  await page.getByRole('combobox').selectOption('all');
  const privacy = page.getByRole('checkbox', { name: ar ? /أوافق على إظهار/ : /Show my first name/ });
  await expect(privacy).not.toBeChecked(); await privacy.check();
  await page.getByRole('button', { name: ar ? 'حفظ التفضيلات' : 'Save preferences', exact: true }).click();
  await expect.poll(() => saved).toEqual({ publicName: true });
  await expect(page.getByRole('status').filter({ hasText: ar ? 'تم حفظ تفضيلاتك.' : 'Your preferences were saved.' })).toBeVisible();
  await page.getByRole('navigation', { name: ar ? 'تصنيف المسابقات' : 'Competition categories' }).getByRole('link', { name: ar ? 'الامتحانات' : 'Exams', exact: true }).click();
  await expect(challenges.getByRole('article')).toHaveCount(1);
  await expect(challenges.getByRole('heading', { name: ar ? 'تحدي العلوم المباشر' : 'Live science challenge', exact: true })).toBeVisible();
});

test('hub distinguishes failed loading, empty results and administrative pause', async ({ page }) => {
  await studentSession(page);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.addInitScript(() => localStorage.setItem('klevro-install-dismissed', String(Date.now())));
  await page.route('**/api/auth/me', route => route.fulfill({ json: { authenticated: true, user: { id: 'me', role: 'STUDENT' } } }));
  let mode = 'failed';
  await page.route('**/api/competitions**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/profile')) return route.fulfill({ json: { profile: { sound: false, motion: false, publicName: false }, policy } });
    if (path.endsWith('/leaderboard')) return route.fulfill({ json: { items: [], enabled: true } });
    return mode === 'failed' ? route.fulfill({ status: 503, json: { error: 'SERVER_ERROR' } }) : route.fulfill({ json: { items: [], policy: { ...policy, enabled: mode !== 'paused' } } });
  });
  await page.goto('/competitions');
  await expect(page.getByRole('alert').filter({ hasText: 'Could not complete the request' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your next challenge starts here', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Save preferences', exact: true })).toBeDisabled();
  mode = 'empty'; await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your next challenge starts here', exact: true })).toBeVisible();
  mode = 'paused'; await page.getByRole('button', { name: 'Refresh competitions', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Competitions are currently paused', exact: true })).toBeVisible();
});
