import { test, expect } from '@playwright/test';

for (const role of ['SUPER_ADMIN', 'SCHOOL_ADMIN']) for (const language of ['ar', 'en']) test(role + ' edits school and grade through full competition settings (' + language + ')', async ({ page }) => {
  test.setTimeout(60000); const ar = language === 'ar', superAdmin = role === 'SUPER_ADMIN', base = superAdmin ? '/super-admin' : '/school-admin';
  const text = (a: string, e: string) => ar ? a : e;
  let room: any = { id: 'room', title: 'مسابقة الرياضيات', titleEn: 'Math challenge', schoolId: superAdmin ? null : 'own', schoolName: 'مدرسة الرواد', grade: null, subject: 'MATH', status: 'OPEN', mode: 'SELF_PACED', currentIndex: -1, sourceKind: 'GENERAL', questionCount: 20, participants: 0 };
  let saved: any;
  const questions = Array.from({ length: 20 }, (_, index) => ({ id: 'q' + index, type: 'MCQ', text: 'Question ' + index, options: ['A', 'B'], correctAnswer: 'B', points: 5, seconds: 30 }));
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.addInitScript(({ role, language }) => { const prefix = role === 'SUPER_ADMIN' ? 'super_admin' : 'school_admin'; localStorage.setItem(prefix + '_token', 'cookie_auth'); localStorage.setItem(prefix + '_user', JSON.stringify({ id: 'admin', role, schoolId: 'own' })); localStorage.setItem('lms_lang', language); }, { role, language });
  await page.route('**/api/**', route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user: { id: 'admin', role, schoolId: 'own' } } });
    if (path === '/api/competitions/manage') return route.fulfill({ json: { items: [room, { ...room, id: 'played', title: 'Started competition', titleEn: 'Started competition', participants: 3 }] } });
    if (path === '/api/competitions/manage/options') return route.fulfill({ json: { schools: [{ id: 'own', name: 'مدرسة الرواد' }, { id: 'target', name: 'مدرسة النيل الدولية' }], grades: ['الصف الثاني الثانوي'], subjects: ['MATH'], exams: [], courses: [] } });
    if (path === '/api/competitions/room') return route.fulfill({ json: { room, admin: true, questions } });
    if (path === '/api/competitions/manage/room' && request.method() === 'PATCH') { saved = request.postDataJSON(); room = { ...room, ...saved, schoolName: saved.schoolId === 'target' ? 'مدرسة النيل الدولية' : 'مدرسة الرواد' }; return route.fulfill({ json: { id: 'room' } }); }
    return route.fulfill({ json: [] });
  });
  await page.goto(base + '/competitions');
  const card = page.getByRole('article', { name: text('مسابقة الرياضيات', 'Math challenge'), exact: true });
  await expect(card).toContainText(text('المدرسة المستهدفة', 'Target school'));
  await expect(card).toContainText(text('الصف المستهدف', 'Target grade'));
  await expect(card.getByRole('link', { name: text('نتائج الطلاب', 'Student results') })).toHaveAttribute('href', base + '/competitions/room/results');
  await expect(page.getByRole('article', { name: 'Started competition' }).getByRole('link', { name: text('تعديل المسابقة', 'Edit competition') })).toBeEnabled();
  await card.getByRole('link', { name: text('تعديل المسابقة', 'Edit competition') }).click();
  await page.getByRole('link', { name: new RegExp(text('بيانات المسابقة', 'Competition details')) }).click();
  if (superAdmin) {
    await page.getByRole('combobox', { name: text('إتاحة المسابقة', 'Competition audience'), exact: true }).selectOption('SCHOOL');
    await page.getByRole('combobox', { name: text('المدرسة', 'School'), exact: true }).selectOption('target');
  }
  await page.getByRole('combobox', { name: text('الصف الدراسي', 'Grade'), exact: true }).selectOption('الصف الثاني الثانوي');
  await page.getByRole('combobox', { name: text('المادة', 'Subject'), exact: true }).selectOption('MATH');
  await page.getByRole('button', { name: text('حفظ ومتابعة للأسئلة', 'Save & continue to questions'), exact: true }).click();
  await expect(page).toHaveURL(base + '/competitions/room/edit');
  expect(saved.grade).toBe('الصف الثاني الثانوي'); expect(saved.questions).toHaveLength(20);
  await page.goto(base + '/competitions');
  await expect(card).toContainText(text('الصف الثاني الثانوي', 'Grade 11 Secondary'));
  await expect(card).toContainText(superAdmin ? 'مدرسة النيل الدولية' : 'مدرسة الرواد');
});
