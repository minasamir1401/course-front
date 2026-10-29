import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { studentSession } from './helpers/studentWorkspace';

for (const language of ['ar', 'en']) test(`notification inbox filters, pagination and read state are usable and responsive ${language}`, async ({ page }) => {
  test.setTimeout(90000);
  const ar = language === 'ar';
  await studentSession(page, language);
  await page.addInitScript(() => localStorage.setItem('klevro-install-dismissed', String(Date.now())));
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  const now = Date.now();
  const items = [
    { id: 'lesson-update', kind: 'LESSON', titleAr: 'درس جديد في مقرر الرياضيات', titleEn: 'A new lesson in Mathematics', body: ar ? 'مراجعة الكسور جاهزة لك. افتح الدرس وكمّل من آخر خطوة.' : 'Your fractions review is ready. Open the lesson and pick up where you left off.', href: '/lessons/lesson?courseId=course', readAt: null as string | null, createdAt: new Date(now - 60000).toISOString() },
    { id: 'exam-update', kind: 'EXAM_OPEN', titleAr: 'اختبار الجبر متاح الآن', titleEn: 'Your algebra assessment is open', body: ar ? 'راجع تعليمات الاختبار والمواعيد المتاحة قبل بدء المحاولة.' : 'Review the instructions and available dates before starting your attempt.', href: '/exams/exam/details', readAt: null as string | null, createdAt: new Date(now - 3600000).toISOString() },
    { id: 'course-update', kind: 'COURSE', titleAr: 'تحديث في مقرر اللغة الإنجليزية', titleEn: 'Your English course has an update', body: ar ? 'محتوى جديد متاح ضمن مقرراتك.' : 'New content is available in your courses.', href: '/courses/course', readAt: new Date(now - 1000).toISOString() as string | null, createdAt: new Date(now - 86400000).toISOString() },
    { id: 'certificate-update', kind: 'CERTIFICATE', titleAr: 'شهادة جديدة من مدرستك', titleEn: 'A new certificate from your school', body: ar ? 'يمكنك مراجعة الشهادة المرسلة لحسابك.' : 'You can review the certificate sent to your account.', href: '/certificates', readAt: null as string | null, createdAt: new Date(now - 172800000).toISOString() },
  ];
  let writes = 0;
  const filters: URLSearchParams[] = [];
  await page.route('**/api/notifications**', route => {
    if (route.request().method() === 'PATCH') {
      writes++; const body = route.request().postDataJSON();
      items.forEach(item => { if (!body.id || item.id === body.id) item.readAt = new Date().toISOString(); });
      return route.fulfill({ json: { success: true, unread: items.filter(item => !item.readAt).length } });
    }
    const params = new URL(route.request().url()).searchParams; filters.push(params);
    const kinds: Record<string, string[]> = { learning: ['COURSE', 'LESSON'], assessments: ['EXAM', 'EXAM_OPEN'], certificates: ['CERTIFICATE'] };
    const found = items.filter(item => (params.get('unread') !== '1' || !item.readAt) && (!kinds[params.get('category') || ''] || kinds[params.get('category')!].includes(item.kind)) && (!params.get('q') || JSON.stringify(item).toLowerCase().includes(params.get('q')!.toLowerCase())));
    const offset = Number(params.get('offset') || 0);
    return route.fulfill({ json: { items: found.slice(offset, offset + 2), total: found.length, inboxTotal: items.length, unread: items.filter(item => !item.readAt).length } });
  });
  await page.route('**/api/push/config', route => route.fulfill({ json: { enabled: false } }));
  await page.goto('/notifications');
  await expect(page.getByRole('heading', { name: ar ? items[0].titleAr : items[0].titleEn, exact: true })).toBeVisible();
  expect(writes).toBe(0);
  await page.getByRole('button', { name: ar ? 'عرض المزيد' : 'Load more', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(4);
  for (const width of [320, 390, 1191, 1536]) {
    await page.setViewportSize({ width, height: 880 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390 || width === 1191) {
      const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, message: n.failureSummary })) }))).toEqual([]);
      await page.screenshot({ path: `../artifacts/platform/notifications-redesign-${language}-${width}.png`, fullPage: true });
    }
  }
  await page.getByRole('button', { name: ar ? 'غير المقروء' : 'Unread', exact: false }).click();
  await expect.poll(() => filters.at(-1)?.get('unread')).toBe('1');
  await expect(page.locator('article')).toHaveCount(2);
  await page.getByRole('button', { name: ar ? 'تحديد كمقروء' : 'Mark read', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: ar ? items[0].titleAr : items[0].titleEn, exact: true })).toHaveCount(0);
  expect(writes).toBe(1);
  await page.getByRole('combobox', { name: ar ? 'نوع الإشعار' : 'Notification type', exact: true }).selectOption('certificates');
  await expect(page.getByRole('heading', { name: ar ? items[3].titleAr : items[3].titleEn, exact: true })).toBeVisible();
  await page.getByRole('searchbox', { name: ar ? 'ابحث في الإشعارات' : 'Search notifications', exact: true }).fill('no-matching-update');
  await expect(page.getByRole('heading', { name: ar ? 'لا توجد إشعارات مطابقة' : 'No matching updates', exact: true })).toBeVisible();
  await page.getByRole('button', { name: ar ? 'عرض كل الإشعارات' : 'View all notifications', exact: true }).click();
  await expect(page.getByRole('heading', { name: ar ? items[0].titleAr : items[0].titleEn, exact: true })).toBeVisible();
});

test('notification failures stay visible and retry recovers without inventing an empty inbox', async ({ page }) => {
  await studentSession(page, 'en');
  await page.addInitScript(() => localStorage.setItem('klevro-install-dismissed', String(Date.now())));
  let fail = true;
  await page.route('**/api/notifications**', route => route.fulfill({ status: fail ? 500 : 200, json: fail ? { error: 'Unavailable' } : { items: [], unread: 0, total: 0, inboxTotal: 0 } }));
  await page.goto('/notifications');
  await expect(page.getByRole('alert').filter({ hasText: 'Unable to load notifications.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'You’re all caught up', exact: true })).toHaveCount(0);
  fail = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You’re all caught up', exact: true })).toBeVisible();
});
