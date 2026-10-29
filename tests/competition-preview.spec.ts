import { serverSession } from './helpers/serverSession';
import { test, expect } from '@playwright/test';
test.use({ serviceWorkers: 'block' });

for (const role of ['SUPER_ADMIN', 'SCHOOL_ADMIN']) for (const language of ['ar', 'en']) test(role + ' previews a finished competition as a student without real participation (' + language + ')', async ({ page }) => {
  const ar = language === 'ar', base = role === 'SUPER_ADMIN' ? '/super-admin' : '/school-admin';
  const text = (a: string, e: string) => ar ? a : e;
  await serverSession(page, role);
  await page.addInitScript(({ role, language }) => {
    const prefix = role === 'SUPER_ADMIN' ? 'super_admin' : 'school_admin';
    localStorage.setItem(prefix + '_token', 'cookie_auth');
    localStorage.setItem(prefix + '_user', JSON.stringify({ id: 'admin', role, schoolId: 'own' }));
    localStorage.setItem('lms_lang', language); localStorage.setItem('klevro-install-dismissed', String(Date.now()));
  }, { role, language });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  const room = { id: 'room', title: 'معاينة الرياضيات', titleEn: 'Math preview', status: 'FINISHED', mode: 'LIVE', schoolId: 'own', schoolName: 'School', questionCount: 2, participants: 20, scoringMode: 'POINTS' };
  const submissions: any[] = [], unexpectedWrites: string[] = [];
  await page.route('**/api/**', route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user: { id: 'admin', role, schoolId: 'own' } } });
    if (path === '/api/competitions/manage') return route.fulfill({ json: { items: [room] } });
    if (path === '/api/competitions/manage/room/preview') return route.fulfill({ json: { preview: true, room, policy: { enabled: true, sound: false, motion: false }, questions: [
      { id: 'q1', text: 'اختر العدد أربعة', textEn: 'Choose four', type: 'MCQ', options: ['٤', '٠'], optionsEn: ['4', '0'], points: 100, seconds: 60 },
      { id: 'q2', text: 'الأرض كوكب', textEn: 'Earth is a planet', type: 'TRUE_FALSE', options: ['True', 'False'], seconds: 60, points: 100 },
    ] } });
    if (path === '/api/competitions/manage/room/preview-answer') {
      const body = request.postDataJSON(); submissions.push(body);
      return route.fulfill({ json: { preview: true, questionId: body.questionId, correct: body.questionId === 'q2', points: body.questionId === 'q2' ? 100 : 0, correctAnswer: body.questionId === 'q1' ? '٤' : 'True', correctAnswerEn: body.questionId === 'q1' ? '4' : 'True' } });
    }
    if (request.method() !== 'GET' && path.startsWith('/api/competitions')) unexpectedWrites.push(path);
    return route.fulfill({ json: {} });
  });
  await page.goto(base + '/competitions');
  const preview = page.getByRole('link', { name: text('معاينة كطالب', 'Preview as student'), exact: true });
  await expect(preview).toHaveAttribute('href', base + '/competitions/room/preview'); await preview.click();
  await expect(page.getByRole('complementary', { name: text('وضع المعاينة', 'Preview mode') })).toBeVisible();
  await page.getByRole('button', { name: text('انضم للمنافسة', 'Join competition'), exact: true }).click();
  await page.getByRole('button', { name: text('ابدأ السؤال الأول', 'Start first question'), exact: true }).click();
  await page.locator('[data-answer-option]').nth(1).click();
  await expect(page.getByRole('status', { name: text('نتيجة الإجابة', 'Answer result') })).toContainText(text('٤', '4'));
  expect(submissions[0]).toMatchObject({ questionId: 'q1', selectedIndex: 1, language });
  await page.getByRole('button', { name: text('السؤال التالي', 'Next question'), exact: true }).click();
  await page.locator('[data-answer-option]').first().click();
  await expect(page.getByText(text('التحدّي اكتمل', 'CHALLENGE COMPLETED'), { exact: true })).toBeVisible();
  expect(submissions).toHaveLength(2); expect(unexpectedWrites).toEqual([]);
  for (const width of [320, 623, 1480]) {
    await page.setViewportSize({ width, height: 840 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.screenshot({ path: '../artifacts/competition-preview-' + role + '-' + language + '.png', fullPage: true });
  await page.getByRole('button', { name: text('إعادة المعاينة', 'Restart preview'), exact: true }).click();
  await expect(page.getByRole('button', { name: text('انضم للمنافسة', 'Join competition'), exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: text('كل المسابقات', 'All competitions'), exact: true })).toHaveAttribute('href', base + '/competitions');
});

test('empty drafts offer the question editor instead of a zero-question attempt', async ({ page }) => {
  await serverSession(page, 'SUPER_ADMIN');
  await page.addInitScript(() => {
    localStorage.setItem('super_admin_token', 'cookie_auth'); localStorage.setItem('super_admin_user', JSON.stringify({ id: 'admin', role: 'SUPER_ADMIN' })); localStorage.setItem('lms_lang', 'en');
  });
  await page.route('**/api/**', route => {
    if (new URL(route.request().url()).pathname === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user: { id: 'admin', role: 'SUPER_ADMIN' } } });
    return route.fulfill({ json: { room: { id: 'empty', title: 'Draft', status: 'DRAFT' }, policy: {}, questions: [] } });
  });
  await page.goto('/super-admin/competitions/empty/preview');
  await expect(page.getByRole('heading', { name: 'Add questions to start the preview' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Add questions', exact: true })).toHaveAttribute('href', '/super-admin/competitions/empty/edit');
  await expect(page.getByRole('button', { name: 'Join competition', exact: true })).toHaveCount(0);
});

test('preview timeouts grade once without creating a real attempt', async ({ page }) => {
  await serverSession(page, 'SCHOOL_ADMIN');
  await page.addInitScript(() => {
    localStorage.setItem('school_admin_token', 'cookie_auth'); localStorage.setItem('school_admin_user', JSON.stringify({ id: 'admin', role: 'SCHOOL_ADMIN', schoolId: 'own' })); localStorage.setItem('lms_lang', 'en');
  });
  let answers = 0;
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user: { id: 'admin', role: 'SCHOOL_ADMIN', schoolId: 'own' } } });
    if (path.endsWith('/preview-answer')) {
      answers++; expect(route.request().postDataJSON()).toMatchObject({ answer: null, questionId: 'q' });
      expect(route.request().postDataJSON().elapsedMs).toBeGreaterThanOrEqual(5000);
      return route.fulfill({ json: { preview: true, questionId: 'q', points: 0, correct: false, correctAnswer: 'A' } });
    }
    if (path.endsWith('/preview')) return route.fulfill({ json: { room: { id: 'timer', title: 'Timed preview', mode: 'SELF_PACED' }, policy: { sound: false, motion: false }, questions: [{ id: 'q', type: 'MCQ', text: 'Timed question', options: ['A', 'B'], seconds: 5, points: 100 }] } });
    if (route.request().method() !== 'GET' && path.startsWith('/api/competitions')) throw new Error('Unexpected real competition write: ' + path);
    return route.fulfill({ json: {} });
  });
  await page.goto('/school-admin/competitions/timer/preview');
  await page.getByRole('button', { name: 'Join competition', exact: true }).click();
  await page.getByRole('button', { name: 'Start first question', exact: true }).click();
  await expect(page.getByText('CHALLENGE COMPLETED', { exact: true })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('0 competition points', { exact: true })).toBeVisible();
  expect(answers).toBe(1);
});
