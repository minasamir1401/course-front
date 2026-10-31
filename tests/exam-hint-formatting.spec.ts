import { serverSession } from './helpers/serverSession';
import { test, expect, Page, Locator } from '@playwright/test';

const copiedQuestion = '<p>أوجد المجموع: <span class="math-tex inline-block mx-1 align-middle cursor-pointer hover:ring-2 hover:ring-indigo-400 rounded px-1 transition-all" contenteditable="false" data-latex="1+2">\\(1+2\\)</span></p>';
async function setup(page: Page, role: string, stored = false, open = true) {
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
    if (path === '/api/exams/exam/questions' && stored) return route.fulfill({ json: [{
      id: 'stored-question', moduleId: 'module', subExamId: 'sub', type: 'MCQ', label: 'MCQ', points: 1,
      text: copiedQuestion, textEn: '<p>Find the <font color="#dc2626">answer</font></p>',
      options: ['أ', 'ب'], optionsEn: ['A', 'B'], correctAnswer: 'أ', correctAnswerEn: 'A',
      hint: '<p>تلميح عربي</p>', hintEn: '<p>English hint</p>',
      sections: [{ id: 'saved-explanation', type: 'EXPLANATION', content: '<p>شرح عربي</p>', contentEn: '<p>English explanation</p>' }],
    }] });
    if (path === '/api/translate') {
      const body = request.postDataJSON(); translations.push(body);
      const tr = (text: string) => text.replaceAll('Find the answer', 'أوجد الإجابة').replaceAll('Use the formula', 'استخدم القانون').replaceAll('English explanation', 'الشرح العربي').replaceAll('Late hint', 'تلميح مضاف لاحقًا');
      return route.fulfill({ json: body.text !== undefined ? { translatedText: tr(body.text) } : { translations: body.texts.map(tr) } });
    }
    return route.fulfill({ json: path.includes('/metadata') ? { domains: [], standards: [], indicators: [], outcomes: [] } : [] });
  });
  await page.goto(`/${prefix}/exams/edit/exam?moduleId=module&subExamId=sub`);
  if (open) {
    if (stored) await page.getByTitle('Edit', { exact: true }).first().click();
    else await page.getByRole('button', { name: '+ إضافة سؤال', exact: true }).click();
    await expect(page.locator('.editor-content').first()).toBeVisible();
  }
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
  test(`${role}: editor Enter and implicit actions cannot submit or reload the page, explicit save still submits`, async ({ page }) => {
    test.setTimeout(90000);
    await setup(page, role, true);
    const editors=page.locator('.editor-content');
    const form=editors.first().locator('xpath=ancestor::form[1]');
    const errors:string[]=[], navigations:string[]=[];
    page.on('pageerror', e=>errors.push(e.message));
    page.on('request', r=>{if(r.isNavigationRequest()&&r.frame()===page.mainFrame())navigations.push(r.url());});
    const marker=await form.evaluate(el=>{
      const state={submits:0,actions:0,marker:crypto.randomUUID()};
      (window as any).__editorSubmitTest=state;
      // Observe native submission without actually writing an exam in this fixture.
      el.addEventListener('submit',event=>{event.preventDefault();event.stopPropagation();state.submits++;});
      return state.marker;
    });
    for(const index of [1,2]){
      const editor=editors.nth(index); await editor.click();
      await editor.evaluate(el=>{const data=new DataTransfer();data.setData('text/html','<p class="MsoNormal"><b>Hint 💡:</b> Use the two coordinate points to calculate the rate of change.</p>');data.setData('text/plain','Hint 💡: Use the two coordinate points to calculate the rate of change.');el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));});
      await editor.press('Control+End');await editor.press('Enter');await editor.pressSequentially('Kept after Enter');
      await expect(editor).toContainText('Kept after Enter');
    }
    const option=page.locator('[data-editor-control="math"] input[type="text"]').first();
    await option.focus();await option.press('End');await option.press('Enter');
    await form.evaluate(el=>{
      const button=document.createElement('button');button.textContent='Legacy editing action';
      button.onclick=()=>{(window as any).__editorSubmitTest.actions++;};el.append(button);button.click();button.remove();
      (el as HTMLFormElement).requestSubmit();
    });
    expect(await page.evaluate(()=>(window as any).__editorSubmitTest)).toEqual({submits:0,actions:1,marker});
    await page.getByRole('button',{name:'حفظ الاختبار',exact:true}).click();
    expect(await page.evaluate(()=>(window as any).__editorSubmitTest.submits)).toBe(1);
    expect(errors).toEqual([]);expect(navigations).toEqual([]);
  });
  test(`${role}: collapsed question summaries never cut through a long math tag`, async ({ page }) => {
    await setup(page, role, true, false);
    await expect(page.getByTitle('Edit', { exact: true }).first()).toBeVisible();
    await expect(page.locator('main')).toContainText('أوجد المجموع');
    await expect(page.locator('main')).not.toContainText('<span');
    await expect(page.locator('main .katex').first()).toBeVisible();
  });
  test(`${role}: external HTML pasted into hints and explanations stays content and does not navigate`, async ({ page }) => {
    test.setTimeout(90000);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await setup(page, role, true);
    const url = page.url(); const navigations: string[] = [];
    page.on('request', request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) navigations.push(request.url()); });
    const editors = page.locator('.editor-content');
    const html = '<html><head><style>body{display:none}</style></head><body><form action="/unexpected-submit"><div class="fixed inset-0 editor-content" style="position:fixed;z-index:999999;color:rgb(220,38,38)"><font color="#dc2626">Copied coloured explanation</font><input onfocus="window.pasteCallback=1"><button type="submit">Submit</button><a href="/unexpected-navigation">Copied link</a><table><tr><td>Useful table</td></tr></table>' + copiedQuestion + '</div></form></body></html>';
    for (const index of [1, 2]) {
      await editors.nth(index).click();
      await editors.nth(index).evaluate((element, html) => {
        const data = new DataTransfer(); data.setData('text/html', html); data.setData('text/plain', 'Copied coloured explanation');
        element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
      }, html);
      await expect(editors.nth(index)).toContainText('Copied coloured explanation');
      await expect(editors.nth(index)).toContainText('Useful table');
      await expect(editors.nth(index).locator('form,input,button,style,meta,a[href],[onfocus]')).toHaveCount(0);
      await expect(editors.nth(index).locator('font')).toHaveAttribute('color', '#dc2626');
      await expect(editors.nth(index).locator('.fixed, .editor-content')).toHaveCount(0);
      await expect(editors.nth(index).locator('.math-tex')).toHaveAttribute('data-latex', '1+2');
      await expect(editors.nth(index).locator('.math-tex')).toHaveAttribute('contenteditable', 'false');
      expect(await editors.nth(index).evaluate(el => Array.from(el.querySelectorAll<HTMLElement>('[style]')).some(node => node.style.position === 'fixed'))).toBe(false);
    }
    for (let i = 0; i < 3; i++) {
      await editors.nth(1).click(); await editors.nth(1).press('End'); await editors.nth(1).pressSequentially(' hint');
      await editors.nth(2).click(); await editors.nth(2).press('End'); await editors.nth(2).pressSequentially(' explanation');
    }
    expect(page.url()).toBe(url); expect(navigations).toEqual([]); expect(errors).toEqual([]);
  });
  for (const stored of [false, true]) test(`${role}: ${stored ? 'saved' : 'new'} question hint/explanation focus preserves document and unsaved text`, async ({ page }) => {
    test.setTimeout(90000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await setup(page, role, stored);
    if (!stored) await page.getByRole('button', { name: 'إضافة شرح وتفسير', exact: true }).click();
    const editors = page.locator('.editor-content');
    const documentId = await page.evaluate(() => {
      const id = crypto.randomUUID();
      (window as any).__editorDocumentId = id;
      return id;
    });
    const documentRequests: string[] = [];
    page.on('request', request => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documentRequests.push(request.url());
    });
    const url = page.url();
    // Click rather than fill: exercise focus/blur, caret and native Enter editing.
    for (const [language, label] of [['en', 'English (EN)'], ['ar', 'العربية (Arabic)']]) {
      await page.getByRole('button', { name: label, exact: true }).click();
      for (let round = 0; round < 2; round++) {
        for (const [index, text] of [[0, 'Question'], [1, 'Hint'], [2, 'Explanation']] as const) {
          const editor = editors.nth(index);
          await editor.click();
          await expect(editor).toBeFocused();
          await editor.press('Control+End');
          await editor.press('Enter');
          await editor.pressSequentially(`${language} ${text} ${round}`);
          await expect(editor).toContainText(`${language} ${text} ${round}`);
        }
      }
      // A DOM edit not accompanied by input is published on blur (e.g. an IME).
      await editors.nth(1).click();
      await editors.nth(1).evaluate(element => { element.innerHTML += '<p>Committed on blur</p>'; });
      await editors.nth(2).click();
      await page.getByRole('button', { name: language === 'en' ? 'العربية (Arabic)' : 'English (EN)', exact: true }).click();
      await page.getByRole('button', { name: label, exact: true }).click();
      await expect(editors.nth(1)).toContainText('Committed on blur');
      await expect(editors.nth(2)).toContainText(`${language} Explanation 1`);
    }
    expect(page.url()).toBe(url);
    expect(await page.evaluate(() => (window as any).__editorDocumentId)).toBe(documentId);
    expect(documentRequests).toEqual([]);
    expect(errors).toEqual([]);
  });

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
