import { test, expect } from '@playwright/test';
import { serverSession } from './helpers/serverSession';

test('super-admin dashboard uses its cookie session without sending the login marker as a JWT', async ({ page, context }) => {
  const user = { id: 'cookie-admin', name: 'Session test', role: 'SUPER_ADMIN' };
  await page.addInitScript(user => {
    localStorage.setItem('super_admin_token', 'cookie_auth');
    localStorage.setItem('super_admin_user', JSON.stringify(user));
    localStorage.setItem('lms_lang', 'ar');
  }, user);
  await serverSession(page, 'SUPER_ADMIN');
  const requests: Array<Record<string, string>> = [];
  await page.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/super-admin/stats') {
      const headers = await request.allHeaders();
      requests.push(headers);
      const authorized = !headers.authorization && headers.cookie?.includes('auth_token=');
      await route.fulfill({ status: authorized ? 200 : 400, contentType: 'application/json',
        body: JSON.stringify(authorized ? { schoolsCount: 7, studentsCount: 21, teachersCount: 3, recentSchools: [] } : { error: 'Invalid token.' }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(url.pathname.includes('/auth/') ? { authenticated: true, ...user, user } : []) });
  });
  const response = page.waitForResponse(response => response.url().includes('/api/super-admin/stats'));
  await page.goto('/super-admin');
  expect((await response).status()).toBe(200);
  expect(requests.length).toBeGreaterThan(0);
  for (const headers of requests) expect(headers.authorization).toBeUndefined();
  await expect(page.getByText(/^[7٧]$/).first()).toBeVisible();
});

test('expired dashboard data refreshes once and the next page uses the renewed session', async ({ page, context }) => {
  const user = { id: 'cookie-admin', name: 'Session test', role: 'SUPER_ADMIN' };
  await page.addInitScript(user => {
    localStorage.setItem('super_admin_token', 'cookie_auth');
    localStorage.setItem('super_admin_user', JSON.stringify(user));
  }, user);
  await serverSession(page, 'SUPER_ADMIN');
  await context.addCookies([{ name: 'auth_refresh', value: 'test-refresh-session', url: process.env.BASE_URL || 'http://localhost:3000', httpOnly: true }]);
  let refreshed = false; let refreshes = 0;
  const successfulPaths = new Set<string>();
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const headers = await route.request().allHeaders();
    expect(headers.authorization).toBeUndefined();
    if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user } });
    if (path === '/api/auth/refresh-token') {
      expect(headers.cookie).toContain('auth_refresh=test-refresh-session');
      refreshes++; refreshed = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ refreshed: true, user, expiresAt: Date.now() + 3600000 }) });
      return;
    }
    if (path === '/api/super-admin/stats' || path === '/api/admin/schools') {
      if (!refreshed) {
        await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Access denied. No token provided.' }) });
        return;
      }
      successfulPaths.add(path);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(path.endsWith('/stats') ? { schoolsCount: 7, recentSchools: [] } : []) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.goto('/super-admin');
  await expect(page.getByText(/^[7٧]$/).first()).toBeVisible();
  expect(refreshes).toBe(1);
  expect(successfulPaths.has('/api/super-admin/stats')).toBe(true);
  const schools = page.waitForResponse(response => response.url().includes('/api/admin/schools'));
  await page.goto('/super-admin/schools');
  expect((await schools).status()).toBe(200);
  expect(successfulPaths.has('/api/admin/schools')).toBe(true);
  await expect(page).toHaveURL(/\/super-admin\/schools$/);
});
