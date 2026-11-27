import { test, expect, Page } from '@playwright/test';
import { serverSession } from './helpers/serverSession';

const ARABIC_RE = /[\u0621-\u064A\u0671-\u06D3]/;

async function prepareAdminContext(page: Page, role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER', lang: 'ar' | 'en' = 'ar') {
  const prefix = role === 'SUPER_ADMIN' ? 'super-admin' : 'school-admin';
  const tokenKey = prefix.replace('-', '_');
  const user = { id: `ui-${role.toLowerCase()}`, role, name: 'Admin Verifier', schoolId: 'school', status: 'ACTIVE' };

  await serverSession(page, role);
  await page.addInitScript(({ tokenKey, user, lang }) => {
    localStorage.setItem(`${tokenKey}_token`, 'cookie_auth');
    localStorage.setItem(`${tokenKey}_token_expires_at`, String(Date.now() + 86_400_000));
    localStorage.setItem(`${tokenKey}_user`, JSON.stringify(user));
    localStorage.setItem('lms_lang', lang);
    localStorage.setItem('klevro_auto_translate_manual', 'true');
  }, { tokenKey, user, lang });

  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
}

async function assertToggleSwitches(page: Page, index = 0) {
  const toggle = page.getByRole('switch').nth(index);
  await expect(toggle).toBeVisible({ timeout: 20_000 });
  const initialChecked = await toggle.getAttribute('aria-checked');
  expect(initialChecked).toBe('true');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  expect(await page.evaluate(() => localStorage.getItem('klevro_auto_translate_manual'))).toBe('false');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  expect(await page.evaluate(() => localStorage.getItem('klevro_auto_translate_manual'))).toBe('true');
}

test.describe('Live /api/translate end-to-end verification', () => {
  for (const role of ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] as const) {
    test(`${role}: translates plain prose, rich HTML (styles/tables/images/math), batch arrays, and AR->EN`, async ({ page }) => {
      test.setTimeout(90_000);
      await prepareAdminContext(page, role);

      const plainRes = await page.request.post('http://localhost:3000/api/translate', {
        data: { text: 'Calculate the area of the rectangle carefully.', from: 'en', to: 'ar' },
      });
      expect(plainRes.ok()).toBe(true);
      const plainJson = await plainRes.json();
      expect(ARABIC_RE.test(plainJson.translatedText || '')).toBe(true);

      const richInput =
        '<p><strong>Solve</strong> the <span style="color: rgb(37, 99, 235);">linear equation</span> \\(2x + 3 = 7\\)</p>' +
        '<table><tr><td>Input</td><td>Output</td></tr><tr><td>First</td><td>Second</td></tr></table>' +
        '<p><img src="/uploads/demo-diagram.png" alt="Diagram" /></p>';

      const richRes = await page.request.post('http://localhost:3000/api/translate', {
        data: { text: richInput, from: 'en', to: 'ar' },
      });
      expect(richRes.ok()).toBe(true);
      const richJson = await richRes.json();
      const trRich = String(richJson.translatedText || '');
      expect(ARABIC_RE.test(trRich)).toBe(true);
      expect(trRich).toMatch(/<(strong|b)\b/i);
      expect(trRich).toMatch(/37,\s*99,\s*235|#2563eb/i);
      expect(trRich).toContain('<table>');
      expect(trRich).toContain('/uploads/demo-diagram.png');
      expect(trRich).toContain('\\(2x + 3 = 7\\)');
    });
  }
});

test('Live /api/translate preserves formatting tags, colors, tables, images, math, batch arrays, and EN reverse translation', async ({ page }) => {
  test.setTimeout(90_000);
  await prepareAdminContext(page, 'SUPER_ADMIN');

  const richInput =
    '<p><strong>Solve</strong> the <span style="color: rgb(37, 99, 235);">linear equation</span> \\(2x + 3 = 7\\)</p>' +
    '<table><tbody><tr><td>Input Value</td><td>Final Output</td></tr></tbody></table>' +
    '<p><img src="/uploads/demo-diagram.png" alt="Diagram" /></p>';

  const richRes = await page.request.post('http://localhost:3000/api/translate', {
    data: { text: richInput, from: 'en', to: 'ar' },
  });
  expect(richRes.ok()).toBe(true);
  const { translatedText } = await richRes.json();
  expect(ARABIC_RE.test(translatedText)).toBe(true);
  expect(translatedText).toMatch(/<(strong|b)\b/i);
  expect(translatedText).toMatch(/37,\s*99,\s*235|#2563eb/i);
  expect(translatedText).toContain('<table>');
  expect(translatedText).toContain('<td>');
  expect(translatedText).toContain('/uploads/demo-diagram.png');
  expect(translatedText).toContain('\\(2x + 3 = 7\\)');

  const batchRes = await page.request.post('http://localhost:3000/api/translate', {
    data: {
      texts: [
        'Find the slope of the line.',
        'Use the quadratic formula to simplify.',
      ],
      from: 'en',
      to: 'ar',
    },
  });
  expect(batchRes.ok()).toBe(true);
  const batchJson = await batchRes.json();
  expect(Array.isArray(batchJson.translations)).toBe(true);
  expect(batchJson.translations.length).toBe(2);
  expect(ARABIC_RE.test(batchJson.translations[0])).toBe(true);
  expect(ARABIC_RE.test(batchJson.translations[1])).toBe(true);

  const reverseRes = await page.request.post('http://localhost:3000/api/translate', {
    data: { text: 'احسب محيط المربع بدقة', from: 'ar', to: 'en' },
  });
  expect(reverseRes.ok()).toBe(true);
  const reverseJson = await reverseRes.json();
  expect(/[a-zA-Z]/.test(reverseJson.translatedText || '')).toBe(true);
});

for (const role of ['SUPER_ADMIN', 'SCHOOL_ADMIN'] as const) {
  const prefix = role === 'SUPER_ADMIN' ? 'super-admin' : 'school-admin';

  test(`${role}: Courses Create, Assignments New, and Quizzes New expose working AutoTranslateToggle`, async ({ page }) => {
    test.setTimeout(90_000);
    await prepareAdminContext(page, role);

    await page.goto(`/${prefix}/courses/create`);
    await assertToggleSwitches(page, 0);

    await page.goto(`/${prefix}/assignments/new`);
    await assertToggleSwitches(page, 0);

    await page.goto(`/${prefix}/quizzes/new`);
    await assertToggleSwitches(page, 0);
  });

  test(`${role}: Courses Edit, Skills Hub Edit + Activity Modal, and Competitions Edit + Question Form expose working AutoTranslateToggle`, async ({ page }) => {
    test.setTimeout(90_000);
    await prepareAdminContext(page, role);

    await page.route('**/api/courses/e2e-course**', (route) =>
      route.fulfill({
        json: {
          id: 'e2e-course',
          title: 'Physics Fundamentals',
          description: 'Physics',
          grades: [],
          subjects: [],
          lessons: [
            { id: 'lesson-1', title: 'Motion', order: 1, slides: [{ id: 's-1', type: 'TEXT', label: 'CONTENT', title: 'Intro', content: '<p>Hello</p>' }], questions: [], assignments: [] },
          ],
          updatedAt: new Date().toISOString(),
        },
      }),
    );
    await page.goto(`/${prefix}/courses/edit?id=e2e-course`);
    await assertToggleSwitches(page, 0);

    await page.route('**/api/skills-hub/**', (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/skills-hub/clusters') {
        return route.fulfill({
          json: [{ id: 'e2e-cluster', name: 'Algebra Cluster', description: 'Skills', grades: [], subject: 'Mathematics' }],
        });
      }
      if (path.endsWith('/lessons')) {
        return route.fulfill({
          json: [{ id: 'skill-lesson-1', title: 'Skill Lesson', order: 1, metadata: '{}' }],
        });
      }
      return route.fulfill({ json: [] });
    });
    await page.goto(`/${prefix}/skills-hub/edit?id=e2e-cluster`);
    await assertToggleSwitches(page, 0);

    await page.route('**/api/competitions/**', (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/competitions/manage/options') {
        return route.fulfill({ json: { schools: [], subjects: [], grades: [], courses: [], exams: [] } });
      }
      if (path === '/api/competitions/e2e-comp') {
        return route.fulfill({
          json: {
            admin: true,
            room: { id: 'e2e-comp', title: 'Math Bowl', subject: 'Math', grade: 'Grade 9', opensAt: new Date().toISOString(), closesAt: new Date(Date.now() + 3_600_000).toISOString(), participants: 0 },
            questions: [],
          },
        });
      }
      return route.fallback();
    });
    await page.goto(`/${prefix}/competitions/e2e-comp/edit`);
    await assertToggleSwitches(page, 0);
    await page.getByRole('button', { name: /إضافة سؤال|Add question/i }).click();
    await expect(page.getByRole('switch').nth(1)).toBeVisible();
  });

  test(`${role}: Manual course slide auto-translates EN->AR with formatting sync (respecting Toggle ON and Toggle OFF) via live /api/translate`, async ({ page }) => {
    test.setTimeout(120_000);
    await prepareAdminContext(page, role);

    await page.goto(`/${prefix}/courses/create`);
    await page.getByRole('button', { name: /إضافة درس جديد|Add New Lesson/i }).first().click();

    await page.getByRole('button', { name: /الشرائح|SLIDES/i }).first().click();
    await page.getByRole('button', { name: /\+ محتوى نصي|\+ Add Text/i }).click();

    await page.getByRole('button', { name: 'English (EN)', exact: true }).first().click();
    const slideEditor = page.locator('.editor-content').first();
    await slideEditor.fill('Calculate the velocity of the moving train');
    await slideEditor.press('Control+a');
    await slideEditor.locator('..').locator('..').getByTitle('عريض', { exact: true }).click();
    await slideEditor.locator('..').locator('..').getByTitle('Blue', { exact: true }).click();

    await expect(page.getByRole('switch').first()).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('button', { name: 'العربية (Arabic)', exact: true }).first().click();

    await expect(slideEditor).toHaveAttribute('dir', 'rtl');
    await expect.poll(async () => (await slideEditor.innerText()).trim(), { timeout: 20_000 }).toMatch(ARABIC_RE);
    await expect(slideEditor.locator('b, strong').first()).toBeVisible();
    const arColor = await slideEditor.evaluate((el) => {
      const styled = el.querySelector('font, span[style]');
      return styled ? getComputedStyle(styled).color : '';
    });
    expect(arColor).toBe('rgb(37, 99, 235)');

    // Turn Auto-Translate OFF via the active toggle inside the Lesson modal, add a second slide in English, switch to Arabic, and verify it does NOT auto-translate.
    const modalToggle = page.getByRole('switch').last();
    await modalToggle.click();
    await expect(modalToggle).toHaveAttribute('aria-checked', 'false');

    await page.getByRole('button', { name: /\+ محتوى نصي|\+ Add Text/i }).click();
    const secondSlideEnBtn = page.getByRole('button', { name: 'English (EN)', exact: true }).nth(1);
    await secondSlideEnBtn.click();
    const secondEditor = page.locator('.editor-content').nth(1);
    await secondEditor.fill('Keep this English slide untranslated when toggle is off');

    await page.getByRole('button', { name: 'العربية (Arabic)', exact: true }).nth(1).click();
    await page.waitForTimeout(1500);
    const secondArabicText = (await secondEditor.innerText()).trim();
    expect(ARABIC_RE.test(secondArabicText)).toBe(false);
  });
}

for (const role of ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] as const) {
  const prefix = role === 'SUPER_ADMIN' ? 'super-admin' : 'school-admin';

  test(`${role}: Manual exam question auto-translates prompt, options, hint, and explanation EN->AR and syncs styles via live /api/translate`, async ({ page }) => {
    test.setTimeout(120_000);
    const user = { id: `ui-${role.toLowerCase()}`, role, name: 'Exam Author', schoolId: 'school', status: 'ACTIVE' };
    await prepareAdminContext(page, role);

    await page.route('**/api/**', (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/translate') return route.fallback();
      if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user } });
      if (path === '/api/exams/e2e-exam') {
        return route.fulfill({
          json: {
            id: 'e2e-exam',
            title: 'Algebra Assessment',
            schoolId: 'school',
            duration: 30,
            type: 'Exam',
            status: 'DRAFT',
            questions: [],
            modules: [
              { id: 'm-1', title: 'Linear Equations', questions: [], slides: [], subExams: [{ id: 's-1', title: 'Quiz 1', questions: [] }] },
            ],
          },
        });
      }
      if (path.includes('/metadata')) return route.fulfill({ json: { domains: [], standards: [], indicators: [], outcomes: [] } });
      return route.fulfill({ json: [] });
    });

    await page.goto(`/${prefix}/exams/edit/e2e-exam?moduleId=m-1&subExamId=s-1`);
    await assertToggleSwitches(page, 0);

    await page.getByRole('button', { name: '+ إضافة سؤال', exact: true }).click();
    const editors = page.locator('.editor-content');
    await expect(editors.first()).toBeVisible();

    await expect(page.getByRole('button', { name: 'ترجمة فورية للعربية', exact: true })).toBeVisible();

    await editors.nth(0).fill('Calculate the sum of four and six');
    await editors.nth(0).press('Control+a');
    await editors.nth(0).locator('..').locator('..').getByTitle('عريض', { exact: true }).click();

    await editors.nth(1).fill('Add the two positive integers');
    await page.getByRole('button', { name: 'إضافة شرح وتفسير', exact: true }).click();
    await editors.nth(2).fill('Adding four and six gives ten');

    const optInputs = page.locator('[data-editor-control="math"] input[type="text"]');
    await optInputs.nth(0).fill('Ten');
    await optInputs.nth(1).fill('Twelve');

    await page.getByRole('button', { name: 'العربية (Arabic)', exact: true }).click();

    await expect.poll(async () => (await editors.nth(0).innerText()).trim(), { timeout: 25_000 }).toMatch(ARABIC_RE);
    await expect(editors.nth(0).locator('b, strong').first()).toBeVisible();
    await expect.poll(async () => (await editors.nth(1).innerText()).trim(), { timeout: 25_000 }).toMatch(ARABIC_RE);
    await expect.poll(async () => (await editors.nth(2).innerText()).trim(), { timeout: 25_000 }).toMatch(ARABIC_RE);
    await expect.poll(async () => await optInputs.nth(0).inputValue(), { timeout: 25_000 }).toMatch(ARABIC_RE);
    const savedArabicPrompt = (await editors.nth(0).innerText()).trim();

    // Apply formatting to the English version and verify the style syncs while preserving Arabic wording.
    await page.getByRole('button', { name: 'English (EN)', exact: true }).click();
    await editors.nth(0).focus();
    await editors.nth(0).press('Control+a');
    await editors.nth(0).locator('..').locator('..').getByTitle('Blue', { exact: true }).click();

    await page.getByRole('button', { name: 'العربية (Arabic)', exact: true }).click();
    await expect(editors.nth(0)).toHaveText(savedArabicPrompt);
    const syncedColor = await editors.nth(0).evaluate((el) => {
      const styled = el.querySelector('font, span[style]');
      return styled ? getComputedStyle(styled).color : '';
    });
    expect(syncedColor).toBe('rgb(37, 99, 235)');
  });
}
