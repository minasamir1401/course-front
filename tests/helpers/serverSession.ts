import type { Page } from '@playwright/test';
export async function serverSession(page: Page, role: string = 'STUDENT') {
  const value = process.env[`UI_TEST_SESSION_${role}`];
  if (!value) throw new Error('Missing disposable server session; run through the Playwright config.');
  await page.context().addCookies([{ name: 'auth_token', value, url: process.env.BASE_URL || 'http://localhost:3000', httpOnly: true, sameSite: 'Lax' }]);
}
