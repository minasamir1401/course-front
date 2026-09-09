import { test, expect } from '@playwright/test';
const examId = 'performance-exam';
const moduleId = 'performance-module';
const childId = 'performance-child';
function fixture() {
  const questions = Array.from({ length: 40 }, (_, i) => ({ id: `question-${i}`, text: `Question ${i + 1}: choose an answer`, type: 'MCQ', options: ['Option A', 'Option B'], correctAnswer: 'Option A', points: 1, xpPoints: 10, moduleId, subExamId: childId, order: i }));
  return { id: examId, title: 'Performance Exam', duration: 1, passingScore: 50, status: 'PUBLISHED', isCentral: true, resultVisibility: 'SHOW_SCORE', attemptsAllowed: 999, questions,
    modules: [{ id: moduleId, title: 'Module', duration: 1, subExams: [{ id: childId, title: 'Child Exam', duration: 1, questionsCount: 40 }, { id: 'sibling', title: 'Sibling', questionsCount: 1000 }] }] };
}
async function prepare(page: any, role: string) {
  const requests: any[] = [];
  const exam = fixture();
  await page.addInitScript(({ role }: any) => {
    localStorage.setItem('lms_lang', 'en');
    const prefix = role === 'SUPER_ADMIN' ? 'super_admin' : role === 'SCHOOL_ADMIN' ? 'school_admin' : 'lms';
    localStorage.setItem(`${prefix}_token`, 'test-session');
    localStorage.setItem(`${prefix}_user`, JSON.stringify({ id: 'test-user', name: 'Tester', role, schoolId: 'school', status: 'ACTIVE' }));
  }, { role });
  await page.route('**/api/**', async (route: any) => {
    const req = route.request(); const url = new URL(req.url());
    requests.push({ path: url.pathname, query: url.searchParams.toString(), method: req.method(), body: req.method() === 'PUT' || req.method() === 'POST' ? req.postDataJSON() : null });
    let data: any = [];
    if (url.pathname.endsWith('/check')) data = { canTakeAgain: true };
    else if (url.pathname.endsWith('/verify-access')) data = { success: true };
    else if (url.pathname.endsWith('/submit')) data = { submissionId: 'result-test' };
    else if (url.pathname.includes('/submissions/')) data = { id: 'result-test', totalScore: 1, percentage: 100, totalQuestions: 1, correctAnswers: 1, earnedXP: 10, createdAt: new Date().toISOString(), exam: { title: 'Result ready', resultVisibility: 'SHOW_SCORE', totalPoints: 1 }, answers: [] };
    else if (url.pathname.endsWith('/questions')) data = { questions: url.searchParams.get('subExamId') === 'sibling' ? [] : exam.questions };
    else if (url.pathname === `/api/exams/${examId}`) data = req.method() === 'PUT' ? { exam: { id: examId }, modules: exam.modules, questions: exam.questions } : { ...exam, questions: url.searchParams.get('includeQuestions') === 'false' ? [] : exam.questions };
    else if (url.pathname.includes('/auth/') || url.pathname.endsWith('/me')) data = { id: 'test-user', role, user: { id: 'test-user', role } };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
  });
  return requests;
}
test('student selection survives countdown ticks and auto submission uses latest answers', async ({ page }) => {
  await page.clock.install();
  const requests = await prepare(page, 'STUDENT');
  await page.goto(`/exams/${examId}?subExamId=${childId}`);
  await page.getByRole('button', { name: 'Start Exam Now' }).click();
  await page.getByText('Option A', { exact: true }).click();
  await page.clock.fastForward(2000);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('exam_performance-exam_performance-child_answers') || '[]')[0]?.selectedAnswer)).toBe('Option A');
  await page.clock.fastForward(60000);
  await expect(page).toHaveURL(/exams\/result\/result-test/);
  const submits = requests.filter(r => r.path.endsWith('/submit'));
  expect(submits).toHaveLength(1);
  expect(submits[0].body.answers[0].selectedAnswer).toBe('Option A');
  await expect(page.getByText('Result ready', { exact: true })).toBeVisible();
});
for (const [role, prefix] of [['SUPER_ADMIN', 'super-admin'], ['SCHOOL_ADMIN', 'school-admin']]) {
  test(`${role} loads and saves only selected child questions`, async ({ page }) => {
    const requests = await prepare(page, role);
    await page.goto(`/${prefix}/exams/edit/${examId}?moduleId=${moduleId}&subExamId=${childId}`);
    await expect(page.getByRole('heading', { name: 'Child Exam', exact: true })).toBeVisible();
    await expect.poll(() => requests.some(r => r.path.endsWith('/questions') && r.query.includes(`subExamId=${childId}`))).toBe(true);
    await page.getByRole('button', { name: 'Save Exam', exact: true }).click();
    await expect.poll(() => requests.filter(r => r.method === 'PUT' && r.path === `/api/exams/${examId}`).length).toBeGreaterThan(0);
    const write = requests.find(r => r.method === 'PUT' && r.path === `/api/exams/${examId}`);
    expect(write.body.questionScopeId).toBe(childId);
    expect(write.body.modules).toBeUndefined();
    expect(write.body.questions.every((q: any) => q.subExamId === childId)).toBe(true);
  });
  test(`${role} student preview opens and selects answers`, async ({ page }) => {
    await prepare(page, role);
    await page.goto(`/exams/${examId}?subExamId=${childId}&preview=true`);
    await page.getByRole('button', { name: 'Start Exam Now' }).click();
    await page.getByText('Option B', { exact: true }).click();
    await expect(page.getByText('Option B', { exact: true })).toBeVisible();
  });
}
for (const [role, prefix] of [['SUPER_ADMIN', 'super-admin'], ['SCHOOL_ADMIN', 'school-admin']]) {
  test(`${role} flushes the latest question when navigating back before autosave delay`, async ({ page }) => {
    const requests = await prepare(page, role);
    await page.goto(`/${prefix}/exams/edit/${examId}?moduleId=${moduleId}&subExamId=${childId}`);
    await page.getByTitle('Edit', { exact: true }).first().click();
    await page.locator('[contenteditable="true"]').first().fill('Latest unsaved unique question text');
    await page.getByRole('button', { name: 'Save Slide to List', exact: true }).click();
    await page.locator(`a[href="/${prefix}/exams/edit/${examId}?moduleId=${moduleId}"]`).first().click();
    await expect.poll(() => requests.some(r => r.method === 'PUT' && r.body?.questionScopeId === childId && r.body.questions.some((q: any) => q.text.includes('Latest unsaved unique question text')))).toBe(true);
  });
}
for (const [role, prefix] of [['SUPER_ADMIN', 'super-admin'], ['SCHOOL_ADMIN', 'school-admin']]) {
  test(`${role} can return to a loaded child while another scope request is pending`, async ({ page }) => {
    await prepare(page, role);
    await page.goto(`/${prefix}/exams/edit/${examId}?moduleId=${moduleId}&subExamId=${childId}`);
    await expect(page.getByRole('button', { name: 'Save Exam', exact: true })).toBeEnabled();
    let release: () => void = () => {};
    const hold = new Promise<void>(resolve => { release = resolve; });
    let held = false;
    await page.route(`**/api/exams/${examId}?includeQuestions=false`, async route => {
      if (!held) { held = true; await hold; }
      await route.fallback();
    });
    try {
      await page.locator(`a[href="/${prefix}/exams/edit/${examId}?moduleId=${moduleId}"]`).first().click();
      await expect.poll(() => held).toBe(true);
      await page.goBack();
      await expect(page.getByRole('heading', { name: 'Child Exam', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Save Exam', exact: true })).toBeEnabled();
    } finally { release(); }
  });
}
