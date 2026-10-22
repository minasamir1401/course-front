import { test, expect } from '@playwright/test';

for (const role of ['SUPER_ADMIN', 'SCHOOL_ADMIN']) for (const language of ['ar', 'en']) test(role + ' opens full student results and edits a published competition (' + language + ')', async ({ page }) => {
  test.setTimeout(60000); const ar = language === 'ar', base = role === 'SUPER_ADMIN' ? '/super-admin' : '/school-admin';
  const text = (a: string, e: string) => ar ? a : e;
  const room = { id: 'room', title: 'تحدي الرياضيات', titleEn: 'Math challenge', status: 'OPEN', schoolId: 'own', grade: 'Grade 10', schoolName: 'مدرسة الرواد', sourceKind: 'GENERAL', mode: 'SELF_PACED', participants: 2, questionCount: 2, subject: 'MATH' };
  let questions = [1, 2].map(index => ({ id: 'q' + index, type: 'MCQ', text: 'Question ' + index, options: ['A', 'B'], correctAnswer: 'B', points: 5, seconds: 30 }));
  let saved: any;
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.addInitScript(({ role, language }) => { const prefix = role === 'SUPER_ADMIN' ? 'super_admin' : 'school_admin'; localStorage.setItem(prefix + '_token', 'cookie_auth'); localStorage.setItem(prefix + '_user', JSON.stringify({ id: 'admin', role, schoolId: 'own' })); localStorage.setItem('lms_lang', language); }, { role, language });
  await page.addInitScript(() => localStorage.setItem('klevro-install-dismissed', String(Date.now())));
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', route => {
    const req = route.request(), path = new URL(req.url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user: { id: 'admin', role, schoolId: 'own' } } });
    if (path === '/api/competitions/manage') return route.fulfill({ json: { items: [room] } });
    if (path === '/api/competitions/manage/options') return route.fulfill({ json: { subjects: ['MATH'], grades: ['Grade 10'], schools: [], courses: [], exams: [] } });
    if (path === '/api/competitions/manage/room/results') return route.fulfill({ json: { room, total: 2, pages: 1, entries: [{ id: 'entry', student: { name: 'أحمد محمد علي', grade: 'Grade 10', school: { name: 'مدرسة الرواد' } }, score: 5, correct: 1, questionCount: 4, answered: 3, finishedAt: '2026-10-22T00:00:00Z' }, { id: 'empty', student: { name: 'مريم حسن' }, score: 0, correct: 0, questionCount: 4, answered: 0 }] } });
    if (path === '/api/competitions/manage/room/results/entry') return route.fulfill({ json: { room, entry: { id: 'entry', student: { name: 'أحمد محمد علي' }, score: 5 }, answers: ['CORRECT', 'INCORRECT', 'TIMED_OUT', 'UNANSWERED'].map((status, index) => ({ questionId: 'old' + index, index: index + 1, text: 'السؤال الأصلي ' + index, textEn: 'Original question ' + index, answer: index < 2 ? (index === 0 ? 'B' : 'A') : null, correctAnswer: 'B', points: index === 0 ? 5 : 0, maxPoints: 5, correct: index === 3 ? null : index === 0, status, elapsedMs: index === 3 ? null : 1000 })) } });
    if (path === '/api/competitions/room') return route.fulfill({ json: { room, admin: true, questions } });
    if (path === '/api/competitions/manage/room' && req.method() === 'PATCH') { saved = req.postDataJSON(); questions = saved.questions; return route.fulfill({ json: { id: 'room' } }); }
    return route.fulfill({ json: {} });
  });
  await page.goto('/competitions');
  await expect(page).toHaveURL(base + '/competitions');
  await page.getByRole('link', { name: text('نتائج الطلاب', 'Student results'), exact: true }).click();
  await page.getByRole('button', { name: /أحمد محمد علي/ }).click();
  const detail = page.getByRole('region', { name: text('تفاصيل إجابات الطالب', 'Student answer details') });
  await expect(detail.getByRole('heading', { name: 'أحمد محمد علي' })).toBeVisible();
  await expect(detail.getByRole('article')).toHaveCount(4);
  await expect(detail.getByRole('article').nth(0)).toContainText(text('صحيحة', 'Correct'));
  await expect(detail.getByRole('article').nth(1)).toContainText(text('خاطئة', 'Incorrect'));
  await expect(detail.getByRole('article').nth(2)).toContainText(text('انتهى الوقت', 'Timed out'));
  await expect(detail.getByRole('article').nth(3)).toContainText(text('لم يُجب', 'Unanswered'));
  if (role === 'SUPER_ADMIN' && ar) {
    await page.screenshot({ path: '../artifacts/competition-results-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 }); await page.reload();
    await page.getByRole('button', { name: /أحمد محمد علي/ }).click();
    await expect(detail.getByRole('article')).toHaveCount(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: '../artifacts/competition-results-mobile.png', fullPage: true });
  }
  await page.getByRole('link', { name: text('تعديل المسابقة', 'Edit competition'), exact: true }).click();
  await expect(page.getByRole('button', { name: text('إضافة سؤال', 'Add question'), exact: true })).toBeEnabled();
  await page.getByRole('button', { name: text('حذف السؤال 1', 'Remove question 1'), exact: true }).click();
  await page.getByRole('button', { name: text('حفظ الأسئلة', 'Save questions'), exact: true }).click();
  await expect.poll(() => saved?.questions?.length).toBe(1);
  expect(saved.status).toBe('OPEN'); expect(errors).toEqual([]);
});

for (const language of ['ar', 'en']) test('student can select multiple answers and submit (' + language + ')', async ({ page }) => {
  const ar = language === 'ar'; let submitted: any = null;
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.addInitScript(language => { localStorage.setItem('lms_user', JSON.stringify({ id: 'student', role: 'STUDENT', schoolId: 'own' })); localStorage.setItem('lms_token', 'cookie_auth'); localStorage.setItem('lms_lang', language); }, language);
  const state = () => ({ room: { id: 'room', title: 'Math', status: 'OPEN', mode: 'SELF_PACED', questionCount: 1, participants: 1 }, serverNow: new Date().toISOString(), policy: { enabled: true, sound: false, motion: false, leaderboard: false }, entry: { id: 'entry', score: submitted ? 5 : 0, correct: submitted ? 1 : 0, currentIndex: 0, finishedAt: submitted ? new Date().toISOString() : null }, question: submitted ? null : { id: 'q', type: 'MULTI_SELECT', text: 'Choose even numbers', options: ['2', '3', '4'], optionsEn: ['2', '3', '4'], index: 0, startedAt: new Date().toISOString(), seconds: 60 }, leaders: [] });
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user: { id: 'student', role: 'STUDENT', schoolId: 'own' } } });
    if (path === '/api/competitions/room/answer') { submitted = route.request().postDataJSON(); return route.fulfill({ json: state() }); }
    if (path === '/api/competitions/room') return route.fulfill({ json: state() });
    if (path === '/api/competitions/profile') return route.fulfill({ json: { profile: { sound: false, motion: false } } });
    return route.fulfill({ json: {} });
  });
  await page.goto('/competitions/room');
  await page.getByRole('checkbox', { name: '2', exact: true }).check();
  await page.getByRole('checkbox', { name: '4', exact: true }).check();
  expect(submitted).toBeNull();
  await page.getByRole('button', { name: ar ? 'تأكيد الإجابة' : 'Submit answer', exact: true }).click();
  await expect.poll(() => submitted?.answer).toEqual(['2', '4']);
  expect(submitted.language).toBe(language);
  await expect(page.getByText(ar ? '5 نقطة منافسات' : '5 competition points', { exact: true })).toBeVisible();
});
