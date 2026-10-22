import { test, expect } from '@playwright/test';

for (const role of ['SUPER_ADMIN', 'SCHOOL_ADMIN']) test(`${role}: exam editor focus, translation, complete transfer and save`, async ({ page }) => {
  test.setTimeout(60000);
  page.setDefaultTimeout(15000);
  const base = role === 'SUPER_ADMIN' ? '/super-admin' : '/school-admin';
  const question = { id: 'q1', type: 'MCQ', text: 'أوجد قيمة س', options: ['4', '5'], optionsEn: ['4', '5'], correctAnswer: '5', correctAnswerEn: '5', points: 2, seconds: 60, metadata: { hint: 'تلميح س + 3 = 8', explanation: 'الشرح س = 5', domain: 'الجبر' } };
  let saved: any;
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.addInitScript(({ role }) => {
    const prefix = role === 'SUPER_ADMIN' ? 'super_admin' : 'school_admin';
    localStorage.setItem(prefix + '_token', 'cookie_auth'); localStorage.setItem(prefix + '_user', JSON.stringify({ id: 'admin', role, schoolId: 'own', name: 'Admin' }));
    localStorage.setItem('lms_lang', 'ar'); localStorage.setItem('klevro-install-dismissed', String(Date.now()));
  }, { role });
  await page.route('**/api/**', route => {
    const req = route.request(), url = new URL(req.url()), pathname = url.pathname;
    if (pathname === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user: { id: 'admin', role, schoolId: 'own' } } });
    if (pathname === '/api/translate') return route.fulfill({ json: { translations: req.postDataJSON().texts.map((text: string) => text ? 'Translated ' + text : '') } });
    if (pathname === '/api/competitions/manage/options') return route.fulfill({ json: { subjects: ['الرياضيات', 'العلوم'], grades: [], schools: [{ id: 'own', name: 'School' }], courses: [], exams: [{ id: 'exam', title: 'الامتحان الكامل' }] } });
    if (pathname === '/api/competitions/manage/import') return route.fulfill({ json: { sections: [], total: 2, nextOffset: null, items: [0, 1].map(index => ({ key: 'import-' + index, supported: true, sourceLabel: 'الامتحان الكامل', question: { ...question, id: undefined, text: 'سؤال منقول ' + index, metadata: { ...question.metadata, group: 'الامتحان الكامل', origin: { key: 'import-' + index } } } })) } });
    if (pathname === '/api/competitions/manage/room' && req.method() === 'PATCH') { saved = req.postDataJSON(); return route.fulfill({ json: { id: 'room' } }); }
    if (pathname === '/api/competitions/room') return route.fulfill({ json: { admin: true, room: { id: 'room', title: 'مسابقة اختبار', subject: 'الرياضيات', status: 'DRAFT', mode: 'SELF_PACED', sourceKind: 'GENERAL' }, questions: [question] } });
    return route.fulfill({ json: [] });
  });
  await page.goto(base + '/competitions/room/edit');
  await page.getByRole('button', { name: 'تعديل السؤال 1', exact: true }).click();
  const editors = page.locator('[contenteditable="true"]');
  await expect(editors).toHaveCount(3);
  // Repeatedly leaving an explanation with a math span used to pull focus back.
  for (const index of [2, 1, 0, 2, 0, 1]) {
    await editors.nth(index).click(); await expect(editors.nth(index)).toBeFocused();
    await page.keyboard.press('End'); await page.keyboard.type(' + 1');
    await expect(editors.nth(index)).toBeFocused();
  }
  await page.getByRole('button', { name: 'ترجمة فورية للإنجليزية', exact: true }).click();
  await expect(editors.first()).toContainText('Translated');
  await page.getByRole('button', { name: 'Save Question to List', exact: true }).click();
  await expect(editors).toHaveCount(0);
  await page.getByRole('button', { name: 'تعديل السؤال 1', exact: true }).click();
  await expect(editors.nth(1)).toContainText('+ 1');
  await page.getByRole('button', { name: /إلغاء|Cancel/, exact: true }).last().click();
  await expect(editors).toHaveCount(0);
  await page.getByRole('button', { name: 'نقل امتحان أو مقرر', exact: true }).click();
  await page.getByRole('combobox', { name: 'الامتحان', exact: true }).selectOption('exam');
  await page.getByRole('button', { name: 'نقل كل الأسئلة إلى المسابقة', exact: true }).click();
  await expect(page.getByRole('heading', { name: /قائمة الأسئلة \(3\/500\)/ })).toBeVisible();
  await page.getByRole('button', { name: 'حفظ الأسئلة', exact: true }).click();
  await expect.poll(() => saved?.questions?.length).toBe(3);
  expect(saved.questions[0]).toMatchObject({ correctAnswer: '5', seconds: 60, textEn: expect.stringContaining('Translated'), hintEn: expect.stringContaining('Translated'), explanationEn: expect.stringContaining('Translated'), domain: 'الجبر', sections: [expect.objectContaining({ contentEn: expect.stringContaining('Translated') })] });
  expect(saved.questions[1]).toMatchObject({ points: 2, seconds: 60, hint: 'تلميح س + 3 = 8', group: 'الامتحان الكامل' });
  expect(errors).toEqual([]);
});

test('competition details instant translation is editable before saving', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('super_admin_token', 'cookie_auth'); localStorage.setItem('super_admin_user', JSON.stringify({ id: 'admin', role: 'SUPER_ADMIN' })); localStorage.setItem('lms_lang', 'ar'); });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('**/api/**', route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user: { id: 'admin', role: 'SUPER_ADMIN' } } });
    if (pathname === '/api/translate') return route.fulfill({ json: { translations: ['Math challenge', 'Practice mathematics'] } });
    if (pathname === '/api/competitions/manage/options') return route.fulfill({ json: { subjects: ['الرياضيات', 'الفيزياء'], grades: [], schools: [], courses: [], exams: [] } });
    return route.fulfill({ json: [] });
  });
  await page.goto('/super-admin/competitions/new');
  await page.getByLabel('اسم المسابقة', { exact: true }).fill('تحدي الرياضيات');
  await page.getByLabel('وصف المسابقة (اختياري)', { exact: true }).fill('تدريب الرياضيات');
  await page.getByRole('button', { name: 'ترجمة فورية للاسم والوصف', exact: true }).click();
  await expect(page.getByLabel('الاسم بالإنجليزية (اختياري)', { exact: true })).toHaveValue('Math challenge');
  await expect(page.getByRole('textbox', { name: /وصف المسابقة بال/ })).toHaveValue('Practice mathematics');
});
