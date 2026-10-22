import { test, expect } from '@playwright/test';

test('interactive answers retain their edits through automatic room refreshes', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('lms_user', JSON.stringify({ id: 'student', role: 'STUDENT', schoolId: 'own' }));
    localStorage.setItem('lms_token', 'cookie_auth');
    localStorage.setItem('lms_lang', 'en');
    localStorage.setItem('klevro-install-dismissed', String(Date.now()));
  });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  let reads = 0;
  const startedAt = new Date().toISOString();
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user: { id: 'student', role: 'STUDENT' } } });
    if (path === '/api/competitions/profile') return route.fulfill({ json: { profile: { sound: false, motion: false, publicName: false } } });
    if (path === '/api/competitions/polling') {
      reads++;
      return route.fulfill({ json: {
        room: { id: 'polling', title: 'Sequence challenge', mode: 'SELF_PACED', status: 'OPEN', questionCount: 1 },
        entry: { id: 'entry', currentIndex: 0, correct: 0, score: 0 },
        question: { id: 'sequence', text: 'Order these items', type: 'SEQUENCE_ORDER', options: { items: ['one', 'two', 'three'] }, index: 0, startedAt, seconds: 120 },
        serverNow: new Date().toISOString(), policy: { enabled: true, sound: false, motion: false }, leaders: [],
      } });
    }
    return route.fulfill({ json: {} });
  });
  await page.goto('/competitions/polling');
  const editor = page.locator('fieldset');
  await expect(editor).toContainText('one');
  const original = await editor.innerText();
  await editor.getByRole('button', { name: '▼', exact: true }).first().click();
  await expect.poll(() => editor.innerText()).not.toBe(original);
  const edited = await editor.innerText();
  expect(edited).not.toBe(original);
  await expect.poll(() => reads, { timeout: 12000 }).toBeGreaterThanOrEqual(3);
  expect(await editor.innerText()).toBe(edited);
});

test('a disabled competition room offers no participation or answering controls', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('lms_user', JSON.stringify({ id: 'student', role: 'STUDENT' }));
    localStorage.setItem('lms_token', 'cookie_auth'); localStorage.setItem('lms_lang', 'en');
    localStorage.setItem('klevro-install-dismissed', String(Date.now()));
  });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user: { id: 'student', role: 'STUDENT' } } });
    if (path === '/api/competitions/profile') return route.fulfill({ json: { profile: { sound: false, motion: false, publicName: false } } });
    if (path === '/api/competitions/paused') return route.fulfill({ json: { disabled: true, policy: { enabled: false }, room: { id: 'paused', title: 'Paused challenge', status: 'OPEN' } } });
    return route.fulfill({ json: {} });
  });
  await page.goto('/competitions/paused');
  await expect(page.getByRole('heading', { name: 'Competitions are disabled by administration' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Join competition|Submit answer|Start first question/ })).toHaveCount(0);
});
