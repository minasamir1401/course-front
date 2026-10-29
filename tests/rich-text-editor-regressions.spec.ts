import { serverSession } from './helpers/serverSession';
import { test, expect, Page } from '@playwright/test';
import { studentSession, exam } from './helpers/studentWorkspace';

async function openEditor(page: Page, prefix = 'super-admin') {
  const user = { id: 'editor', name: 'Editor', role: prefix === 'super-admin' ? 'SUPER_ADMIN' : 'SCHOOL_ADMIN', schoolId: 'school', status: 'ACTIVE' };
  await serverSession(page, user.role);
  await page.addInitScript(({ user, prefix }) => {
    const key = prefix.replace('-', '_');
    localStorage.setItem('lms_lang', 'ar');
    localStorage.setItem(`${key}_user`, JSON.stringify(user));
    localStorage.setItem(`${key}_token`, 'test-session');
    localStorage.setItem(`${key}_token_expires_at`, String(Date.now() + 86400000));
  }, { user, prefix });
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  await page.route('**/api/**', r => {
    const path = new URL(r.request().url()).pathname;
    const data = path.includes('/auth/') ? { authenticated: true, ...user, user }
      : path.endsWith('/competitions/editor') ? { admin: true, room: { id: 'editor', title: 'تجربة المحرر' }, questions: [{ id: 'q1', text: '<p>السؤال العربي <img src="/klevro/subjects/arabic.webp"></p>', textEn: '<p>English question</p>', type: 'MCQ', options: ['أ', 'ب'], optionsEn: ['A', 'B'], correctAnswer: 'أ', points: 1, seconds: 30, sections: [{ id: 's1', type: 'EXPLANATION', content: 'شرح عربي', contentEn: 'English explanation' }], hint: 'تلميح عربي', hintEn: 'English hint' }] }
      : path.endsWith('/manage/options') ? { schools: [], subjects: [], grades: [], courses: [], exams: [] } : [];
    return r.fulfill({ json: data });
  });
  await page.goto(`/${prefix}/competitions/editor/edit`);
  await page.getByRole('button', { name: 'تعديل السؤال 1', exact: true }).click();
  await expect(page.locator('.editor-content').first()).toContainText('السؤال العربي');
}

async function setFormula(page: Page, formula: string) {
  await expect(page.locator('math-field')).toBeVisible();
  await page.locator('math-field').evaluate((field: any, formula) => {
    field.value = formula;
    field.dispatchEvent(new InputEvent('input', { bubbles: true }));
  }, formula);
}

for (const prefix of ['super-admin', 'school-admin']) {
  test(`${prefix}: math keeps insertion range and draft; insert, edit, delete and typing undo correctly`, async ({ page }) => {
    test.setTimeout(120000);
    await openEditor(page, prefix);
    const editor = page.locator('.editor-content').first();
    await editor.fill('قبل المعادلة وبعدها');
    await editor.evaluate(element => {
      element.focus();
      const range = document.createRange();
      const texts = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      range.setStart(texts.nextNode()!, 'قبل المعادلة '.length);
      range.collapse(true);
      const selection = window.getSelection()!;
      selection.removeAllRanges(); selection.addRange(range);
    });
    const toolbar = editor.locator('..').locator('..');
    await toolbar.getByTitle('إدراج معادلة رياضية', { exact: true }).click();
    await setFormula(page, 'x+7');
    await page.getByRole('button', { name: 'إدراج المعادلة', exact: true }).click();
    await expect(editor.locator('.math-tex')).toHaveAttribute('data-latex', 'x+7');
    expect(await editor.evaluate(element => {
      const before = document.createRange();
      before.selectNodeContents(element);
      before.setEndBefore(element.querySelector('.math-tex')!);
      return before.toString().replace(/\u00a0/g, ' ');
    })).toBe('قبل المعادلة ');
    await page.keyboard.press('Control+z');
    await expect(editor).toHaveText('قبل المعادلة وبعدها');
    await expect(editor.locator('.math-tex')).toHaveCount(0);
    await page.keyboard.press('Control+Shift+z');
    await expect(editor.locator('.math-tex')).toHaveCount(1);
    await editor.locator('.math-tex').click();
    await setFormula(page, 'y+8');
    await page.getByRole('button', { name: 'تحديث المعادلة', exact: true }).click();
    await expect(editor.locator('.math-tex')).toHaveAttribute('data-latex', 'y+8');
    await page.keyboard.press('Control+z');
    await expect(editor.locator('.math-tex')).toHaveAttribute('data-latex', 'x+7');
    await editor.locator('.math-tex').click();
    await expect(page.locator('math-field')).toBeVisible();
    await page.getByRole('button', { name: 'حذف المعادلة', exact: true }).click();
    await expect(editor.locator('.math-tex')).toHaveCount(0);
    await page.keyboard.press('Control+z');
    await expect(editor.locator('.math-tex')).toHaveCount(1);
    await editor.focus(); await page.keyboard.press('Control+End');
    const before = await editor.textContent();
    await page.keyboard.type(' x = 9');
    await expect(editor).toContainText('x = 9');
    await page.keyboard.press('Control+z');
    await expect(editor).toHaveText(before!);
    await toolbar.getByTitle('إدراج معادلة رياضية', { exact: true }).click();
    await expect.poll(() => page.locator('math-field').evaluate((field: any) => field.value)).toBe('y+8');
  });

  test(`${prefix}: language switching isolates prompt, hint, explanation and attached image`, async ({ page }) => {
    test.setTimeout(120000);
    await openEditor(page, prefix);
    const editors = page.locator('.editor-content');
    await page.getByRole('button', { name: 'English (EN)', exact: true }).click();
    await expect(editors.first()).toHaveText('English question');
    await expect(editors.first().locator('img')).toHaveCount(0);
    for (let round = 0; round < 3; round++) {
      await editors.first().click(); await page.keyboard.press('Control+End'); await page.keyboard.type(' + 1');
      await editors.nth(1).click(); await page.keyboard.press('Control+End'); await page.keyboard.type(' hint');
      await page.getByRole('button', { name: 'العربية (Arabic)', exact: true }).click();
      await expect(editors.first()).toContainText('السؤال العربي');
      await expect(editors.first().locator('img')).toHaveCount(1);
      await expect(editors.nth(1)).toHaveText('تلميح عربي');
      await page.getByRole('button', { name: 'English (EN)', exact: true }).click();
      await expect(editors.first()).toHaveText('English question' + ' + 1'.repeat(round + 1));
      await expect(editors.first().locator('img')).toHaveCount(0);
      await expect(editors.nth(2)).toHaveText('English explanation');
    }
    // A newly mounted language editor must not undo into the Arabic document.
    await editors.first().click(); await page.keyboard.press('Control+End');
    await page.keyboard.type(' final'); await page.keyboard.press('Control+z');
    await expect(editors.first()).toHaveText('English question + 1 + 1 + 1');
    await editors.nth(1).fill('');
    await editors.nth(2).fill('');
    await page.getByRole('button', { name: 'العربية (Arabic)', exact: true }).click();
    await expect(editors.nth(1)).toHaveText('تلميح عربي');
    await page.getByRole('button', { name: 'English (EN)', exact: true }).click();
    await expect(editors.nth(1)).toBeEmpty();
    await expect(editors.nth(2)).toBeEmpty();
  });

  test(`${prefix}: option equations preserve text, caret, undo and last draft`, async ({ page }) => {
    await openEditor(page, prefix);
    await page.getByRole('button', { name: 'English (EN)', exact: true }).click();
    const option = page.getByPlaceholder('Option 1 in English (no A, B, C)', { exact: true });
    await option.fill('');
    await option.pressSequentially('Before after');
    await expect(option).toHaveValue('Before after');
    await option.evaluate((input: HTMLInputElement) => { input.focus(); input.setSelectionRange(7, 7); });
    const equationButton = option.locator('..').getByTitle('إدراج معادلة رياضية (Insert Math Equation)', { exact: true });
    await equationButton.click();
    await setFormula(page, 'z+3');
    await page.getByRole('button', { name: 'تأكيد وإدراج', exact: true }).click();
    await expect(option).toHaveValue(/Before .*z\+3.*after/);
    await page.keyboard.press('Control+z');
    await expect(option).toHaveValue('Before after');
    await equationButton.click();
    await expect.poll(() => page.locator('math-field').evaluate((field: any) => field.value)).toBe('z+3');
  });

  test(`${prefix}: calculator matrices and inequalities render completely in option previews`, async ({ page }) => {
    test.setTimeout(120000);
    await openEditor(page, prefix);
    await page.getByRole('button', { name: 'English (EN)', exact: true }).click();
    const option = page.getByPlaceholder('Option 1 in English (no A, B, C)', { exact: true });
    const field = option.locator('..').locator('..');
    const formula = String.raw`\begin{bmatrix}1&-2\\3&4\end{bmatrix}`;
    await option.fill('');
    await option.locator('..').getByTitle('إدراج معادلة رياضية (Insert Math Equation)', { exact: true }).click();
    await setFormula(page, formula);
    await page.getByRole('button', { name: 'تأكيد وإدراج', exact: true }).click();
    await expect(field.locator('.katex')).toHaveCount(1);
    await expect(field.locator('mtable mtr')).toHaveCount(2);
    await expect(field.locator('mtable mtd')).toHaveCount(4);
    await expect(field.locator('annotation')).toContainText('bmatrix');
    await field.screenshot({ path: `../artifacts/math-options/${prefix}-matrix.png` });
    for (const expression of ['-10 < x <= -2', 'x<y && y>z', 'x ≤ -2']) {
      await option.fill(expression);
      await expect(field.locator('.prose')).toHaveText(expression);
      await expect(field.locator('.math-ltr').first()).toBeVisible();
      await expect(option).toHaveValue(expression);
    }
    await option.fill('');
    await option.locator('..').getByTitle('إدراج معادلة رياضية (Insert Math Equation)', { exact: true }).click();
    await setFormula(page, 'y<-10');
    await page.getByRole('button', { name: 'تأكيد وإدراج', exact: true }).click();
    await expect(field.locator('.katex')).toHaveCount(1);
    await expect(field.locator('annotation')).toContainText('y<-10');
    await expect(field).not.toContainText('\\(');
    // Switch languages and remount the option to exercise stored question state.
    const saved = await option.inputValue();
    await page.getByRole('button', { name: 'العربية (Arabic)', exact: true }).click();
    await page.getByRole('button', { name: 'English (EN)', exact: true }).click();
    await expect(option).toHaveValue(saved);
    await expect(field.locator('annotation')).toContainText('y<-10');
  });
}

for (const language of ['ar', 'en']) {
  test(`student ${language}: saved matrix and inequality choices display on desktop and mobile`, async ({ page }) => {
    test.setTimeout(120000);
    await studentSession(page, language);
    await page.route('https://fonts.googleapis.com/**', r => r.abort());
    const choices = [String.raw`\({\Large \begin{bmatrix}1&-2\\3&4\end{bmatrix}}\textstyle\)`, String.raw`\({\Large y<-10}\textstyle\)`, '-10 < x <= -2', 'x<y'];
    await page.route('**/api/exams/exam', r => r.fulfill({ json: { ...exam, questions: [{ ...exam.questions[0], options: choices, optionsEn: choices, correctAnswer: choices[0] }] } }));
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/exams/exam');
      const start = page.getByRole('button', { name: language === 'ar' ? 'ابدأ الامتحان الآن' : 'Start Exam Now', exact: true });
      await start.click();
      const options = page.locator('.exam-option-content');
      await expect(options).toHaveCount(4);
      await expect(options.nth(0).locator('mtable mtd')).toHaveCount(4);
      await expect(options.nth(1).locator('annotation')).toContainText('y<-10');
      await expect(options.nth(2)).toHaveText('-10 < x <= -2');
      await expect(options.nth(3)).toHaveText('x<y');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await options.nth(0).screenshot({ path: `../artifacts/math-options/student-${language}-${width}.png` });
    }
  });
}

test('reported A minus B question renders four matrix choices instead of raw bmatrix text', async ({ page }) => {
  test.setTimeout(120000);
  await studentSession(page);
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  const text = String.raw`<p>Given: \(A=\begin{bmatrix}3&-2\\5&1\end{bmatrix},\quad B=\begin{bmatrix}-1&4\\2&-3\end{bmatrix}\)</p><p>Find \(A-B\).</p>`;
  const choices = [String.raw`2&2\\7&-2`, String.raw`4&-6\\3&4`, String.raw`4&2\\3&-2`, String.raw`2&-6\\3&4`]
    .map(entries => `\\({\\Large \\begin{bmatrix}${entries}\\end{bmatrix}}\\textstyle\\)`);
  const question = { ...exam.questions[0], text, textEn: text, options: choices, optionsEn: choices, correctAnswer: choices[1] };
  await page.route('**/api/exams/exam', r => r.fulfill({ json: { ...exam, questions: [question] } }));
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto('/exams/exam');
  await page.getByRole('button', { name: 'Start Exam Now', exact: true }).click();
  const options = page.locator('.exam-option-content');
  await expect(options).toHaveCount(4);
  for (let index = 0; index < choices.length; index++) {
    await expect(options.nth(index).locator('.katex')).toHaveCount(1);
    await expect(options.nth(index).locator('mtable mtd')).toHaveCount(4);
    await expect(options.nth(index).locator('.katex-error')).toHaveCount(0);
  }
  await options.nth(1).click();
  await expect(options.nth(1).locator('xpath=ancestor::button[1]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-exam-question]').screenshot({ path: '../artifacts/math-options/reported-matrix-question.png' });
});

test('exam preview title keeps usable width at desktop and mobile sizes', async ({ page }) => {
  test.setTimeout(120000);
  await studentSession(page);
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  await page.route('**/api/exams/exam', r => r.fulfill({ json: { ...exam, title: 'Relations and functions examination', titleEn: 'Relations and functions examination', subjects: 'Math' } }));
  for (const width of [320, 623, 1080, 1536]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/exams/exam?preview=true');
    const title = page.locator('#exam-intro-title');
    await expect(title).toBeVisible();
    expect((await title.boundingBox())!.width).toBeGreaterThan(width < 650 ? 190 : 300);
    expect((await title.boundingBox())!.height).toBeLessThan(180);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `../artifacts/editor-regressions/preview-${width}.png`, fullPage: true });
  }
});
