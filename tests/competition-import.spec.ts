import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test.use({ serviceWorkers: 'block' });
const policy = { enabled: true, publicBoard: false, sound: true, motion: true, leaderboard: true };
const examQuestion = { text: 'Exam source question', textEn: null, options: ['A', 'B'], correctIndex: 1, seconds: 30 };
const courseQuestion = { text: 'Course source question', textEn: null, options: ['C', 'D'], correctIndex: 0, seconds: 30 };
for (const role of ['SUPER_ADMIN', 'SCHOOL_ADMIN']) for (const language of ['ar', 'en']) test(`${role} imports selected exam/course questions into a standalone competition ${language}`, async ({ page }) => {
  test.setTimeout(120000); const ar = language === 'ar', base = role === 'SUPER_ADMIN' ? '/super-admin' : '/school-admin'; await page.setViewportSize({ width: 390, height: 920 }); await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.addInitScript(({ role, language }) => { const prefix = role === 'SUPER_ADMIN' ? 'super_admin' : 'school_admin'; localStorage.setItem(`${prefix}_user`, JSON.stringify({ id: 'admin', role, schoolId: 'own', name: 'Admin' })); localStorage.setItem(`${prefix}_token`, 'cookie_auth'); localStorage.setItem('lms_lang', language); localStorage.setItem('klevro-install-dismissed', String(Date.now())); }, { role, language });
  let saved: any = null, published = false, examPages = 0, sourceWrites = 0;
  const summary = () => ({ id: 'room', title: 'Standalone challenge', titleEn: '', status: published ? 'OPEN' : 'DRAFT', mode: 'SELF_PACED', teams: false, currentIndex: -1, participants: 0, capacity: 200, sourceKind: 'GENERAL', questionCount: saved?.questions.length || 0, schoolName: 'School', publicBoard: false });
  await page.route('**/api/**', route => {
    const req = route.request(), url = new URL(req.url()), path = url.pathname;
    if ((path.startsWith('/api/exams/') || path.startsWith('/api/courses/')) && req.method() !== 'GET') sourceWrites++;
    if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user: { id: 'admin', role, schoolId: 'own' } } });
    if (path === '/api/competitions/manage/options') return route.fulfill({ json: { courses: [{ id: 'course', title: 'Real course' }], exams: [{ id: 'exam', title: 'Real exam' }], activities: [], schools: [{ id: 'own', name: 'School' }] } });
    if (path === '/api/competitions/manage/policy') return route.fulfill({ json: policy });
    if (path === '/api/competitions/manage/import') {
      if (url.searchParams.get('kind') === 'COURSE') return route.fulfill({ json: { items: [{ key: 'course-q', text: courseQuestion.text, sourceLabel: 'Real lesson', supported: true, question: courseQuestion }, { key: 'copied-q', text: examQuestion.text, sourceLabel: 'Real lesson', supported: true, question: examQuestion }], total: 2, nextOffset: null, sections: [{ id: 'lesson', title: 'Real lesson' }] } });
      examPages++; const offset = Number(url.searchParams.get('offset') || 0);
      return route.fulfill({ json: { items: offset ? [{ key: 'unsupported', text: 'Matching question', sourceLabel: 'Real child exam', supported: false }] : [{ key: 'exam-q', text: examQuestion.text, sourceLabel: 'Real child exam', supported: true, question: examQuestion }], total: 2, nextOffset: offset ? null : 1, sections: [{ id: 'sub:child', title: 'Real child exam' }] } });
    }
    if (path === '/api/competitions/manage' && req.method() === 'POST') { saved = req.postDataJSON(); expect(saved.sourceKind).toBe('GENERAL'); expect(saved.questions).toHaveLength(2); expect(saved.questions[0].text).toBe('Edited copied question'); expect(saved.questions[0].correctIndex).toBe(1); return route.fulfill({ status: 201, json: { id: 'room' } }); }
    if (path === '/api/competitions/manage') return route.fulfill({ json: { items: saved ? [summary()] : [] } });
    if (path.endsWith('/action')) { published = true; return route.fulfill({ json: { success: true } }); }
    if (path === '/api/competitions/room') return route.fulfill({ json: { room: summary(), admin: true, policy, questions: saved?.questions || [], leaders: [], awards: [], teamScores: [], serverNow: new Date().toISOString() } });
    return route.fulfill({ json: {} });
  });
  await page.goto(`${base}/competitions`); await expect(page).toHaveURL(`${base}/competitions`); await page.getByRole('button', { name: ar ? 'إنشاء مسابقة' : 'Create competition', exact: true }).click();
  await page.getByLabel(ar ? 'عنوان المسابقة' : 'Competition title', { exact: true }).fill('Standalone challenge');
  const importer = page.getByRole('group', { name: ar ? 'استيراد أسئلة من المنصة' : 'Import platform questions', exact: true });
  await importer.getByRole('combobox', { name: ar ? 'المصدر' : 'Source', exact: true }).selectOption('exam');
  await expect(importer.getByRole('checkbox', { name: /Matching question/ })).toBeDisabled(); expect(examPages).toBeGreaterThanOrEqual(2);
  await importer.getByRole('combobox', { name: ar ? 'القسم أو الدرس' : 'Section or lesson', exact: true }).selectOption('sub:child');
  await importer.getByRole('checkbox', { name: ar ? 'تحديد كل الأسئلة القابلة للاستيراد' : 'Select all importable questions', exact: true }).check();
  await importer.getByRole('button', { name: ar ? 'نسخ 1 سؤال للمسابقة' : 'Copy 1 questions to competition', exact: true }).click(); await expect(page.getByRole('status').filter({ hasText: ar ? 'تم نسخ 1 سؤال' : 'Copied 1 questions' })).toBeVisible();
  await importer.getByRole('combobox', { name: ar ? 'نوع المصدر' : 'Source type', exact: true }).selectOption('COURSE'); await importer.getByRole('combobox', { name: ar ? 'المصدر' : 'Source', exact: true }).selectOption('course');
  await importer.getByRole('checkbox', { name: ar ? 'تحديد كل الأسئلة القابلة للاستيراد' : 'Select all importable questions', exact: true }).check(); await importer.getByRole('button', { name: ar ? 'نسخ 2 سؤال للمسابقة' : 'Copy 2 questions to competition', exact: true }).click();
  await expect(page.getByRole('heading', { name: ar ? 'أسئلة المسابقة (2/50)' : 'Competition questions (2/50)', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: ar ? 'نص السؤال' : 'Question text', exact: true }).first().fill('Edited copied question');
  for (const width of [320, 390, 768, 1536]) { await page.setViewportSize({ width, height: 920 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }
  const audit = await new AxeBuilder({ page }).include('main').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); expect(audit.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
  await page.screenshot({ path: `../artifacts/competitions/import-${role}-${language}-1536.png`, fullPage: true });
  await page.getByRole('button', { name: ar ? 'حفظ المسابقة' : 'Save competition', exact: true }).click(); await expect(page).toHaveURL(new RegExp(`${base}/competitions/room$`), { timeout: 30000 });
  await page.getByRole('button', { name: ar ? 'نشر المنافسة' : 'Publish competition', exact: true }).click(); await expect.poll(() => published).toBe(true); expect(sourceWrites).toBe(0);
});
