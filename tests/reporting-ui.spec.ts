import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const options = { schools: [{ id: 'school', name: 'Test school' }], grades: ['Grade 1'], classrooms: [], subjects: [], exams: [{ id: 'exam', title: 'Test exam', schoolId: 'school', modules: [] }] };
const report = {
  generatedAt: '2026-10-15T22:30:00Z', timeZone: 'Africa/Cairo',
  summary: { totalAttempts: 143, selectedAttempts: 120, uniqueStudents: 80, averageScore: 75, passRate: 60, legacyAttempts: 0, eligibleCount: null },
  students: [{ id: 'submission', name: 'Student A', username: 'A1', examTitle: 'Test exam', schoolName: 'Test school', percentage: 75, passingScore: 80, passed: false, createdAt: '2026-10-15T22:30:00Z' }],
  timeline: [{ day: '2026-10-16', attempts: 2, averageScore: 75 }], skills: [], questions: [], schools: [], modules: [], subExams: [],
  pagination: { page: 1, limit: 25, total: 120, pages: 5 },
};

async function setup(page: any, role: string, fail = false, language = 'en') {
  await page.addInitScript(({ role, language }: any) => {
    const key = role === 'SUPER_ADMIN' ? 'super_admin' : role === 'SCHOOL_ADMIN' ? 'school_admin' : 'lms';
    localStorage.setItem(`${key}_token`, 'cookie_auth');
    localStorage.setItem(`${key}_token_expires_at`, String(Date.now() + 3600000));
    localStorage.setItem(`${key}_user`, JSON.stringify({ id: 'me', role, name: 'Test user', schoolId: 'school' }));
    localStorage.setItem('lms_lang', language);
  }, { role, language });
  await page.route('**/api/**', async (route: any) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/reports/export') return route.fulfill({ status: 200, contentType: 'application/octet-stream', body: 'test export' });
    let body: any = [];
    if (url.pathname === '/api/reports/options') body = options;
    if (url.pathname === '/api/student/stats') body = { overallCourseProgress: 20, courseProgresses: [], xp: 10 };
    if (url.pathname === '/api/student/xp-summary') body = { totalXP: 10, courseXP: [] };
    if (url.pathname === '/api/reports/overview') {
      if (fail) return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Report unavailable' }) });
      body = { ...report, pagination: { ...report.pagination, page: Number(url.searchParams.get('page') || 1) } };
    }
    if (url.pathname === '/api/reports/exam-attendance') body = {
      generatedAt: report.generatedAt, total: 131, attendedCount: 1, missedCount: 130, pendingCount: 0,
      rows: [{ id: 'student', name: 'Student B', username: 'B', grade: 'Grade 1', status: 'MISSED', percentage: null }],
      exam: { title: 'Test exam' }, pagination: { page: 1, pages: 2, total: 131 },
    };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

for (const [role, path] of [['STUDENT', '/reports'], ['SCHOOL_ADMIN', '/school-admin/reports'], ['SUPER_ADMIN', '/super-admin/reports']]) {
  test(`${role} report uses real filters, attempt status, Egypt time and accessible controls`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await setup(page, role); await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('75%', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Oct 16, 2026|16 Oct 2026/).first()).toBeVisible();
    await page.getByRole('button', { name: 'Results & attempts', exact: true }).click();
    await expect(page.getByRole('table').getByText('Needs review', { exact: true })).toBeVisible();
    await page.getByLabel('Search records').fill('Student A');
    const request = page.waitForRequest(request => request.url().includes('/reports/overview') && new URL(request.url()).searchParams.get('search') === 'Student A');
    await page.getByRole('button', { name: 'Apply filters', exact: true }).click(); await request;
    await expect(page.getByRole('table').getByText('Needs review', { exact: true })).toBeVisible();
    const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Excel', exact: true }).click();
    expect((await download).suggestedFilename()).toMatch(/\.xlsx$/);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target).join(',')}`)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('mobile report remains usable and does not label the whole cohort from a partial page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await setup(page, 'SCHOOL_ADMIN'); await page.goto('/school-admin/reports');
  await page.getByLabel('Exam', { exact: true }).selectOption('exam'); await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
  await page.getByRole('button', { name: 'Exam participation', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Student B', exact: true })).toBeVisible();
  await expect(page.getByText('All students took the exam', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '../artifacts/quality-report/report-mobile.png', fullPage: true });
});

test('failed report displays an error and retry instead of zero score metrics', async ({ page }) => {
  await setup(page, 'STUDENT', true); await page.goto('/reports');
  await expect(page.getByRole('alert').filter({ hasText: 'Report unavailable' })).toBeVisible();
  await expect(page.getByText('Average score', { exact: true })).toHaveCount(0);
});

test('Arabic reporting preserves RTL layout and Egyptian dates on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page, 'STUDENT', false, 'ar'); await page.goto('/reports');
  await expect(page.getByRole('heading', { name: 'تقدّمك وخطوتك التالية' })).toBeVisible();
  await expect(page.locator('.report-workspace')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByLabel('من يوم — توقيت مصر')).toBeVisible();
  await expect(page.getByText('٧٥%', { exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.map(violation => violation.id)).toEqual([]);
  await page.screenshot({ path: '../artifacts/quality-report/report-arabic-mobile.png', fullPage: true });
});

test('student result displays the saved score instead of regrading current question content', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await setup(page, 'STUDENT');
  await page.route('**/api/exams/submissions/submission', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
    id: 'submission', createdAt: report.generatedAt, totalScore: 7, percentage: 70, historicalSnapshot: true,
    passed: false, correctAnswers: 1, totalQuestions: 2,
    exam: { title: 'Saved result', totalPoints: 10, passingScore: 80, resultVisibility: 'SHOW_ANSWERS' },
    answers: [{ id: 'answer', selectedAnswer: 'B', isCorrect: false, question: { id: 'q', text: 'Edited question', type: 'MCQ', points: 1000, options: ['A', 'B'], correctAnswer: 'B' } }],
  }) }));
  await page.goto('/exams/result/submission');
  await expect(page.getByText('70%', { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Result status' })).toContainText('80%');
  await expect(page.getByText('Review your answers and prepare for your next step', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
