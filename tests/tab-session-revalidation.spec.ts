import { expect, test, type Page, type Route } from '@playwright/test';
import { serverSession } from './helpers/serverSession';
import { studentSession } from './helpers/studentWorkspace';

async function openWorkspace(page: Page, role: string) {
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('klevro-install-dismissed', String(Date.now()));
  });
  if (role === 'STUDENT') {
    await studentSession(page);
    await page.goto('/exams/exam');
    await page.getByRole('button', { name: 'Start Exam Now', exact: true }).click();
    await page.getByRole('button').filter({ hasText: 'Choice A' }).first().click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.locator('[data-exam-question]')).toHaveAttribute('aria-busy', 'false');
    return page.locator('[data-exam-question]');
  }

  const prefix = role === 'SUPER_ADMIN' ? 'super-admin' : 'school-admin';
  const user = { id: 'admin', role, name: 'Author', schoolId: 'school', status: 'ACTIVE' };
  await serverSession(page, role);
  await page.addInitScript(({ prefix, user }) => {
    const key = prefix.replace('-', '_');
    localStorage.setItem(`${key}_token`, 'cookie_auth');
    localStorage.setItem(`${key}_token_expires_at`, String(Date.now() + 86400000));
    localStorage.setItem(`${key}_user`, JSON.stringify(user));
    localStorage.setItem('lms_lang', 'en');
  }, { prefix, user });
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user } });
    if (path === '/api/exams/exam') return route.fulfill({ json: {
      id: 'exam', title: 'Test', schoolId: 'school', duration: 30, type: 'Exam', status: 'DRAFT', questions: [],
      modules: [{ id: 'module', title: 'Module', questions: [], slides: [], subExams: [{ id: 'sub', title: 'New exam', questions: [] }] }],
    } });
    return route.fulfill({ json: path.includes('/metadata') ? { domains: [], standards: [], indicators: [], outcomes: [] } : [] });
  });
  await page.goto(`/${prefix}/exams/edit/exam?moduleId=module&subExamId=sub`);
  await page.getByRole('button', { name: '+ Add Question', exact: true }).click();
  const editor = page.locator('.editor-content').first();
  await expect(editor).toBeVisible();
  await editor.fill('Unsaved question while another tab is open');
  return editor;
}

for (const role of ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT']) {
  test(`${role}: returning from another tab keeps the workspace visible during session verification`, async ({ page, context }) => {
    test.setTimeout(90000);
    const workspace = await openWorkspace(page, role);
    const url = page.url();
    const original = await workspace.elementHandle();
    const contents = await workspace.innerText();
    const documentId = await page.evaluate(() => {
      const value = crypto.randomUUID();
      (window as any).__tabDocumentId = value;
      return value;
    });
    const navigations: string[] = [];
    page.on('request', request => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame()) navigations.push(request.url());
    });

    // Hold the session response so the assertion observes the checking period,
    // rather than just seeing the page recover after a brief loading flash.
    const pending: Route[] = [];
    await page.route('**/api/auth/me', route => { pending.push(route); });
    const other = await context.newPage();
    try {
      await other.goto('about:blank');
      await other.bringToFront();
      await page.bringToFront();
      // Exercise the focus/visibility/pageshow burst browsers can emit together.
      await page.evaluate(() => {
        window.dispatchEvent(new Event('focus'));
        document.dispatchEvent(new Event('visibilitychange'));
        window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
      });
      await expect.poll(() => pending.length).toBeGreaterThan(0);
      await expect(workspace).toBeVisible();
      await expect(page.getByText(/^(Verifying your session…|جارٍ التحقق من تسجيل الدخول…)$/)).toHaveCount(0);
      expect(await workspace.innerText()).toBe(contents);
      if (role !== 'STUDENT') {
        await workspace.click();
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        await expect(workspace).toBeFocused();
      }

      // Retrying a temporarily unavailable service must also preserve the draft.
      for (const route of pending.splice(0)) await route.fulfill({ status: 503, json: { error: 'Temporarily unavailable' } });
      await page.unroute('**/api/auth/me');
      await expect(workspace).toBeVisible();
      if (role !== 'STUDENT') {
        await workspace.press('End');
        await workspace.pressSequentially(' — still editing');
        await expect(workspace).toContainText('still editing');
      }
      const response = page.waitForResponse(response => new URL(response.url()).pathname === '/api/auth/me' && response.ok());
      await page.evaluate(() => window.dispatchEvent(new Event('focus')));
      await response;
      await expect(workspace).toBeVisible();
      expect(await original!.evaluate(element => element.isConnected)).toBe(true);
      expect(await page.evaluate(() => (window as any).__tabDocumentId)).toBe(documentId);
      expect(page.url()).toBe(url);
      expect(navigations).toEqual([]);
      if (role === 'STUDENT') {
        await page.getByRole('button', { name: 'Previous', exact: true }).click();
        await expect(page.getByRole('button').filter({ hasText: 'Choice A' }).first()).toHaveAttribute('aria-pressed', 'true');
      }
    } finally {
      for (const route of pending) await route.abort().catch(() => {});
      await other.close();
    }
  });
}

test('an unavailable first session check keeps the page blocked and supports retry', async ({ page }) => {
  await studentSession(page);
  let unavailable = true;
  await page.route('**/api/auth/me', route => unavailable
    ? route.fulfill({ status: 503, json: { error: 'Temporarily unavailable' } })
    : route.fallback());
  await page.goto('/dashboard');
  await expect(page.getByRole('alert').filter({ hasText: 'Could not verify your session' })).toBeVisible();
  await expect(page.getByText('Mathematics', { exact: true })).toHaveCount(0);
  unavailable = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByText('Mathematics', { exact: true }).first()).toBeVisible();
});

test('approval for one page does not bypass the first verification on another route', async ({ page }) => {
  await studentSession(page);
  await page.goto('/dashboard');
  await expect(page.getByText('Mathematics', { exact: true }).first()).toBeVisible();
  await page.route('**/api/auth/me', route => route.fulfill({ status: 503, json: { error: 'Temporarily unavailable' } }));
  await page.locator('a[href="/courses"]').first().click();
  await expect(page).toHaveURL(/\/courses$/);
  await expect(page.getByRole('alert').filter({ hasText: 'Could not verify your session' })).toBeVisible();
  await expect(page.getByText('Mathematics', { exact: true })).toHaveCount(0);
});
