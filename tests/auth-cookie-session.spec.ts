import { test, expect } from '@playwright/test';

test('super-admin dashboard uses its cookie session without sending the login marker as a JWT', async ({ page, context }) => {
  const user = { id: 'cookie-admin', name: 'Session test', role: 'SUPER_ADMIN' };
  await page.addInitScript(user => {
    localStorage.setItem('super_admin_token', 'cookie_auth');
    localStorage.setItem('super_admin_user', JSON.stringify(user));
    localStorage.setItem('lms_lang', 'ar');
  }, user);
  await context.addCookies([{ name: 'auth_token', value: 'test-cookie-session', url: 'http://localhost:3000', httpOnly: true }]);
  const requests: Array<Record<string, string>> = [];
  await page.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/super-admin/stats') {
      const headers = await request.allHeaders();
      requests.push(headers);
      const authorized = !headers.authorization && headers.cookie?.includes('auth_token=test-cookie-session');
      await route.fulfill({ status: authorized ? 200 : 400, contentType: 'application/json',
        body: JSON.stringify(authorized ? { schoolsCount: 7, studentsCount: 21, teachersCount: 3, recentSchools: [] } : { error: 'Invalid token.' }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(url.pathname.includes('/auth/') ? { ...user, user } : []) });
  });
  const response = page.waitForResponse(response => response.url().includes('/api/super-admin/stats'));
  await page.goto('/super-admin');
  expect((await response).status()).toBe(200);
  expect(requests.length).toBeGreaterThan(0);
  for (const headers of requests) expect(headers.authorization).toBeUndefined();
  await expect(page.getByText('7', { exact: true }).first()).toBeVisible();
});
