import { serverSession } from './helpers/serverSession';
import { test, expect } from '@playwright/test';
import { studentSession, exam } from './helpers/studentWorkspace';

for (const role of ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']) {
  test(`${role}: separate English explanation from Excel appears in the question editor`, async ({ page }) => {
    test.setTimeout(90000);
    const prefix = role === 'SUPER_ADMIN' ? 'super-admin' : 'school-admin';
    const user = { id: 'author', name: 'Author', role, schoolId: 'school', status: 'ACTIVE' };
  await serverSession(page, role);
    await page.addInitScript(({ prefix, user }) => {
      const key = prefix.replace('-', '_');
      localStorage.setItem(key + '_token', 'cookie_auth');
      localStorage.setItem(key + '_token_expires_at', String(Date.now() + 86400000));
      localStorage.setItem(key + '_user', JSON.stringify(user));
      localStorage.setItem('lms_lang', 'ar');
    }, { prefix, user });
    const question = { id: 'q1', moduleId: 'module', subExamId: 'sub', type: 'MCQ', text: 'السؤال العربي', textEn: 'English question', options: ['أ', 'ب'], optionsEn: ['A', 'B'], correctAnswer: 'أ', points: 1,
      hint: 'تلميح عربي', hintEn: 'English hint', explanation: '<p>شرح عربي</p>', explanationEn: '<h2>English explanation from Excel</h2>', sections: [{ id: 's1', content: '<p>شرح عربي</p>' }] };
    await page.route('https://fonts.googleapis.com/**', r => r.abort());
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user } });
      if (path === '/api/exams/exam/questions') return route.fulfill({ json: [question] });
      if (path === '/api/exams/exam') return route.fulfill({ json: { ...exam, schoolId: 'school', status: 'DRAFT', questions: [], modules: [{ id: 'module', title: 'Module', questions: [], slides: [], subExams: [{ id: 'sub', title: 'Sub exam', questions: [question] }] }] } });
      return route.fulfill({ json: path.includes('/metadata') ? { domains: [], standards: [], indicators: [], outcomes: [] } : [] });
    });
    await page.goto(`/${prefix}/exams/edit/exam?moduleId=module&subExamId=sub`);
    await page.getByTitle('Edit', { exact: true }).click();
    const editors = page.locator('.editor-content');
    await expect(editors.first()).toHaveText('السؤال العربي');
    await expect(editors.nth(1)).toHaveText('تلميح عربي');
    await expect(editors.nth(2)).toHaveText('شرح عربي');
    await page.getByRole('button', { name: 'English (EN)', exact: true }).click();
    await expect(editors.first()).toHaveText('English question');
    await expect(editors.nth(1)).toHaveText('English hint');
    await expect(editors.nth(2).locator('h2')).toHaveText('English explanation from Excel');
  });
}

test('standalone app keeps the exam title readable in a narrow card inside a wide window', async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await studentSession(page, 'en');
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = query => {
      const result = original(query);
      if (query === '(display-mode: standalone)') Object.defineProperty(result, 'matches', { value: true });
      return result;
    };
  });
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  await page.route('**/api/exams/exam', r => r.fulfill({ json: { ...exam, title: 'Relations and functions examination', titleEn: 'Relations and functions examination', opensAt: '2026-10-24T08:00:00Z', closesAt: '2026-10-24T10:00:00Z' } }));
  await page.setViewportSize({ width: 1080, height: 800 });
  await page.goto('/exams/exam?preview=true');
  const title = page.locator('#exam-intro-title');
  await expect(title).toBeVisible();
  const card = page.locator('section[aria-labelledby="exam-intro-title"]');
  await card.evaluate(element => { element.style.width = '380px'; });
  await expect.poll(async () => (await title.boundingBox())!.width).toBeGreaterThan(300);
  expect((await title.boundingBox())!.height).toBeLessThan(200);
  await expect(page.getByLabel('Install Klevro', { exact: true })).toHaveCount(0);
  expect(await page.locator('body').innerText()).not.toMatch(/Egypt time|توقيت مصر|Africa\/Cairo/i);
  expect(errors).toEqual([]);
  await page.screenshot({ path: '../artifacts/editor-regressions/standalone-narrow-card.png', fullPage: true });
});

for (const language of ['ar', 'en']) test(`exam intro remains readable without container queries in narrow app panes ${language}`, async ({ page }) => {
  test.setTimeout(90000);
  await studentSession(page, language);
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  await page.route('**/api/exams/exam', r => r.fulfill({ json: { ...exam, title: 'العلاقات والدوال الرياضية', titleEn: 'Relations and functions examination' } }));
  await page.setViewportSize({ width:1080, height:800 });
  await page.goto('/exams/exam?preview=true');
  const title = page.locator('#exam-intro-title');
  await expect(title).toBeVisible();
  await page.getByRole('button', { name: language === 'ar' ? 'العربية' : 'English', exact:true }).click();
  // Simulate an older installed browser engine that ignores container queries.
  await page.evaluate(() => {
    const remove = (sheet: CSSStyleSheet | CSSGroupingRule) => {
      for (let i=sheet.cssRules.length-1; i>=0; i--) {
        const rule=sheet.cssRules[i];
        if (rule.cssText.startsWith('@container')) sheet.deleteRule(i);
        else if ('cssRules' in rule) remove(rule as CSSGroupingRule);
      }
    };
    for (const sheet of Array.from(document.styleSheets)) { try { remove(sheet); } catch {} }
  });
  const card = page.locator('section[aria-labelledby="exam-intro-title"]');
  for (const width of [320,380,620,900]) {
    await card.evaluate((el,width) => { (el as HTMLElement).style.width=`${width}px`; }, width);
    await expect.poll(async () => (await title.boundingBox())!.width).toBeGreaterThan(230);
    expect((await title.boundingBox())!.height).toBeLessThan(210);
    const start=page.getByRole('button', { name:language==='ar'?'ابدأ الامتحان الآن':'Start Exam Now', exact:true });
    await expect(start).toBeVisible();
    expect(await card.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
    if(width===380) await page.screenshot({path:`../artifacts/editor-regressions/intro-no-container-${language}.png`,fullPage:true});
  }
  await page.getByRole('button', { name:language==='ar'?'ابدأ الامتحان الآن':'Start Exam Now', exact:true }).click();
  await expect(title).toHaveCount(0);
});
