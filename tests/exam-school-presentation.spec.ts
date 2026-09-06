import { test, expect } from '@playwright/test';

const examId = '8df54865-b677-4ca4-9686-b6cbd909942c';
const moduleId = '3573036f-7591-44a0-bdc2-4c5da4136ee4';
const school = { id: 'school-a', name: 'مدرسة الاختبار' };
const makeExam = () => {
  const child = (id: string, title: string) => ({ id, title, duration: null, questionsCount: 6, attemptsAllowed: 1, questions: [] });
  const subModules = [
    { id: 'branch-a', title: '444', parentModuleId: moduleId, examsCount: 1, subExams: [child('exam-c', '34434')] },
    { id: 'branch-b', title: '3323', parentModuleId: moduleId, examsCount: 1, subExams: [child('exam-d', '323')] },
  ];
  return {
    id: examId, title: 'موديول بدون عنوان', isCentral: false, schoolId: school.id,
    schools: [school], grades: [], subjects: [], duration: 60, passingScore: 50,
    attemptsAllowed: 1, status: 'PUBLISHED', questions: [], submissions: [],
    modules: [{ id: moduleId, title: 'ميا', duration: 60, parentModuleId: null,
      examsCount: 4, questionsCount: 24, questions: [],
      subExams: [child('exam-a', 'الهندسه'), child('exam-b', '221')], subModules,
    }, ...subModules],
  };
};

async function prepare(page: any, role: string) {
  const user = { id: 'test-user', name: 'اختبار', role, schoolId: school.id, status: 'ACTIVE' };
  await page.addInitScript(({ user, role }: any) => {
    localStorage.setItem('lms_lang', 'ar');
    const prefix = role === 'SUPER_ADMIN' ? 'super_admin' : role === 'SCHOOL_ADMIN' ? 'school_admin' : 'lms';
    localStorage.setItem(`${prefix}_user`, JSON.stringify(user));
    localStorage.setItem(`${prefix}_token`, 'test-session');
  }, { user, role });
  const writes: any[] = [];
  let exam = makeExam();
  await page.route('**/api/**', async (route: any) => {
    const request = route.request();
    const url = new URL(request.url());
    let data: any = [];
    if (request.method() === 'PUT' && url.pathname === `/api/exams/${examId}`) {
      const payload = request.postDataJSON();
      writes.push(payload);
      exam = { ...exam, ...payload };
      data = exam;
    } else if (request.method() === 'PUT' && url.pathname === `/api/exams/${examId}/modules/${moduleId}`) {
      data = { ...exam.modules[0], ...request.postDataJSON() };
      exam.modules[0] = data;
    } else if (url.pathname === '/api/exams') data = [exam];
    else if (url.pathname.endsWith('/questions') || url.searchParams.has('onlyQuestions')) data = { questions: [] };
    else if (url.pathname === `/api/exams/${examId}`) data = exam;
    else if (url.pathname.includes('/schools')) data = [school];
    else if (url.pathname.includes('/auth/') || url.pathname.endsWith('/me')) data = { ...user, user };
    else if (url.pathname.includes('/portfolio')) data = null;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
  });
  return writes;
}

test('student list and details show the module name and all four inherited durations', async ({ page }) => {
  await prepare(page, 'STUDENT');
  await page.goto('/exams');
  await expect(page.getByRole('heading', { name: 'ميا', exact: true })).toBeVisible();
  await expect(page.getByText('قسم بدون عنوان', { exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: /ميا/ }).click();
  await expect(page.getByText('60 دقيقة', { exact: false })).toHaveCount(4);
  await expect(page.getByText('الهندسه', { exact: true })).toBeVisible();
  await expect(page.getByText('34434', { exact: true })).toBeVisible();
});

for (const [role, prefix] of [['SUPER_ADMIN', 'super-admin'], ['SCHOOL_ADMIN', 'school-admin']]) {
  test(`${role} card counts four exams and settings preserve its school`, async ({ page }) => {
    const writes = await prepare(page, role);
    await page.goto(`/${prefix}/exams`);
    const card = page.locator('div.group').filter({ has: page.getByRole('heading', { name: 'ميا', exact: true }) }).first();
    await expect(card).toBeVisible();
    await expect(card.getByText('4', { exact: true })).toBeVisible();
    await expect(card.getByText('24', { exact: true })).toBeVisible();
    await page.goto(`/${prefix}/exams/edit/${examId}?moduleId=${moduleId}`);
    await page.getByRole('button', { name: 'إعدادات الموديول', exact: true }).click();
    await page.getByPlaceholder('مثال: تقييم الرياضيات المتقدمة').fill('ميا الجديد');
    await page.getByRole('button', { name: 'حفظ التغييرات', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'ميا الجديد', exact: true })).toBeVisible();
    expect(writes.some(payload => payload.title === 'ميا الجديد' && payload.isCentral === false && payload.schoolIds.includes(school.id))).toBe(true);
    expect(writes.every(payload => payload.isCentral !== true)).toBe(true);
  });
}
