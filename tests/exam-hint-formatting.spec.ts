import { serverSession } from './helpers/serverSession';
import { test, expect, Page, Locator } from '@playwright/test';

async function setup(page: Page, role: string) {
  const prefix = role === 'SUPER_ADMIN' ? 'super-admin' : 'school-admin';
  const user = { id: 'admin', role, name: 'Author', schoolId: 'school', status: 'ACTIVE' };
  const translations: any[] = [];
  await serverSession(page, role);
  await page.addInitScript(({ prefix, user }) => {
    const key = prefix.replace('-', '_');
    localStorage.setItem(key + '_token', 'cookie_auth');
    localStorage.setItem(key + '_token_expires_at', String(Date.now() + 86400000));
    localStorage.setItem(key + '_user', JSON.stringify(user));
    localStorage.setItem('lms_lang', 'ar');
  }, { prefix, user });
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  await page.route('**/api/**', route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user } });
    if (path === '/api/exams/exam') return route.fulfill({ json: { id: 'exam', title: 'Test', schoolId: 'school', duration: 30, type: 'Exam', status: 'DRAFT', questions: [], modules: [{ id: 'module', title: 'Module', questions: [], slides: [], subExams: [{ id: 'sub', title: 'New exam', questions: [] }] }] } });
    if (path === '/api/translate') {
      const body = request.postDataJSON(); translations.push(body);
      const tr = (text: string) => text.replaceAll('Find the answer', 'أوجد الإجابة').replaceAll('Use the formula', 'استخدم القانون').replaceAll('English explanation', 'الشرح العربي').replaceAll('Late hint', 'تلميح مضاف لاحقًا');
      return route.fulfill({ json: body.text !== undefined ? { translatedText: tr(body.text) } : { translations: body.texts.map(tr) } });
    }
    return route.fulfill({ json: path.includes('/metadata') ? { domains: [], standards: [], indicators: [], outcomes: [] } : [] });
  });
  await page.goto(`/${prefix}/exams/edit/exam?moduleId=module&subExamId=sub`);
  await page.getByRole('button', { name: '+ إضافة سؤال', exact: true }).click();
  await expect(page.locator('.editor-content').first()).toBeVisible();
  return translations;
}

test('a delayed hint translation cannot replace a manually edited Arabic hint', async ({ page }) => {
  test.setTimeout(90000);
  await setup(page, 'SUPER_ADMIN');
  const editors = page.locator('.editor-content');
  await editors.nth(0).fill('Find the answer');
  await page.getByRole('button', { name: 'ترجمة فورية للعربية', exact: true }).click();
  await expect(editors.first()).toHaveText('أوجد الإجابة');
  await page.getByRole('button', { name: 'English (EN)', exact: true }).click();
  await editors.nth(1).fill('Late hint');
  let pending: any;
  await page.route('**/api/translate', route => {
    if (route.request().postDataJSON().text === 'Late hint') { pending = route; return; }
    return route.fallback();
  });
  await page.getByRole('button', { name: 'العربية (Arabic)', exact: true }).click();
  await expect.poll(() => Boolean(pending)).toBe(true);
  await editors.nth(1).fill('تلميح راجعته بنفسي');
  await pending.fulfill({ json: { translatedText: 'تلميح من الترجمة المتأخرة' } });
  await page.getByRole('button', { name: 'English (EN)', exact: true }).click();
  await page.getByRole('button', { name: 'العربية (Arabic)', exact: true }).click();
  await expect(editors.nth(1)).toHaveText('تلميح راجعته بنفسي');
});
async function selectAll(editor: Locator) {
  await editor.focus();
  await editor.press('Control+a');
}
async function format(editor: Locator, title: string) {
  await selectAll(editor);
  await editor.locator('..').locator('..').getByTitle(title, { exact: true }).click();
}

for (const role of ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']) {
  test(`${role}: new exam questions translate hints and share formatting while keeping Arabic text`, async ({ page }) => {
    test.setTimeout(120000);
    const translations = await setup(page, role);
    const editors = page.locator('.editor-content');
    await editors.nth(0).fill('Find the answer');
    await format(editors.nth(0), 'عريض');
    await editors.nth(1).fill('Use the formula');
    await format(editors.nth(1), 'عنوان متوسط');
    await page.getByRole('button', { name: 'إضافة شرح وتفسير', exact: true }).click();
    await editors.nth(2).fill('English explanation');
    await format(editors.nth(2), 'تحت خط');
    await page.getByRole('button', { name: 'ترجمة فورية للعربية', exact: true }).click();
    await expect(editors.nth(0)).toHaveText('أوجد الإجابة');
    await expect(editors.nth(0).locator('b, strong')).toHaveText('أوجد الإجابة');
    await expect(editors.nth(1)).toHaveText('استخدم القانون');
    await expect(editors.nth(1).locator('h2')).toHaveText('استخدم القانون');
    await expect(editors.nth(2).locator('u')).toHaveText('الشرح العربي');
    expect(translations.some(body => body.texts?.[2]?.includes('Use the formula'))).toBe(true);
    // Styling an existing translation must transfer the format and keep Arabic wording.
    await page.getByRole('button', { name: 'English (EN)', exact: true }).click();
    await format(editors.nth(0), 'Blue');
    await format(editors.nth(1), 'توسيط');
    await format(editors.nth(2), 'Blue');
    await page.getByRole('button', { name: 'العربية (Arabic)', exact: true }).click();
    await expect(editors.nth(0)).toHaveText('أوجد الإجابة');
    expect(await editors.nth(0).evaluate(e => getComputedStyle(e.querySelector('font, span[style]')!).color)).toBe('rgb(37, 99, 235)');
    await expect(editors.nth(1)).toHaveText('استخدم القانون');
    expect(await editors.nth(1).evaluate(e => getComputedStyle(e.querySelector('h2')!).textAlign)).toBe('center');
    await expect(editors.nth(2)).toHaveText('الشرح العربي');
    expect(await editors.nth(2).evaluate(e => getComputedStyle(e.querySelector('font, span[style]')!).color)).toBe('rgb(37, 99, 235)');
    // A hint authored after translating the question is filled when Arabic is opened.
    await editors.nth(1).fill('');
    await page.getByRole('button', { name: 'English (EN)', exact: true }).click();
    await editors.nth(1).fill('Late hint');
    await page.getByRole('button', { name: 'العربية (Arabic)', exact: true }).click();
    await expect(editors.nth(1)).toHaveText('تلميح مضاف لاحقًا');
    await page.getByRole('button', { name: 'English (EN)', exact: true }).click();
    await expect(editors.nth(1)).toHaveText('Late hint');
  });
}
