import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pageAccess } from '../src/lib/pageAccess';
import { serverSession } from './helpers/serverSession';
import { studentSession } from './helpers/studentWorkspace';

test('all student and admin page folders require a session, including direct nested links', async ({ request }) => {
  for (const folder of fs.readdirSync(path.resolve(__dirname, '../src/app'), { withFileTypes: true }).filter(entry => entry.isDirectory() && !['api', 'uploads', 'login'].includes(entry.name))) {
    const policy = pageAccess('/' + folder.name);
    expect(policy, folder.name).not.toBeNull();
    const response = await request.get('/' + folder.name, { maxRedirects: 0 });
    expect(response.status(), folder.name).toBe(307);
    expect(new URL(response.headers().location, 'http://localhost').pathname).toBe(policy!.login);
    expect(response.headers()['cache-control']).toContain('no-store');
  }
  for (const route of ['/lessons/private?courseId=one', '/exams/private?preview=true', '/super-admin/courses/lesson?id=one&lessonId=two', '/school-admin/ai']) {
    const response = await request.get(route, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(new URL(response.headers().location, 'http://localhost').searchParams.get('next')).toBe(route);
  }
  const flight = await request.get('/dashboard?_rsc=direct', { headers: { RSC: '1', 'Next-Router-Prefetch': '1' }, maxRedirects: 0 });
  expect(flight.status()).toBe(307);
});

test('homepage, assets and each login remain public; server protection works without JavaScript', async ({ browser, request }) => {
  for (const route of ['/', '/login', '/super-admin/login', '/school-admin/login', '/klevro/brand/klevro-neon.jpeg', '/api/health']) expect((await request.get(route)).status(), route).toBe(200);
  const context = await browser.newContext({ javaScriptEnabled: false }); const page = await context.newPage();
  await page.goto((process.env.BASE_URL || 'http://localhost:3000') + '/dashboard');
  await expect(page).toHaveURL(/\/login\?next=/); await context.close();
});

test('forged localStorage does not open the admin page or cause a login redirect loop', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('super_admin_token', 'cookie_auth'); localStorage.setItem('super_admin_user', JSON.stringify({ id: 'fake', role: 'SUPER_ADMIN' })); });
  await page.goto('/super-admin/settings');
  await expect(page).toHaveURL(/\/super-admin\/login\?next=/);
  await expect(page.locator('input[type="password"]')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('super_admin_token'))).toBeNull();
});

test('forged, expired and inactive sessions are rejected by the backend before rendering', async ({ page }) => {
  for (const value of ['cookie_auth', 'eyJhbGciOiJub25lIn0.eyJyb2xlIjoiU1VQRVJfQURNSU4ifQ.', process.env.UI_TEST_EXPIRED_SESSION!, process.env.UI_TEST_SESSION_INACTIVE_STUDENT!]) {
    await page.context().clearCookies();
    await page.context().addCookies([{ name: 'auth_token', value, url: process.env.BASE_URL || 'http://localhost:3000', httpOnly: true }]);
    const response = await page.context().request.get('/super-admin/settings', { maxRedirects: 0 });
    expect(response.status()).toBe(307); expect(response.headers().location).toContain('/super-admin/login');
  }
});

test('valid roles open their portal while student cookies cannot open administration', async ({ page }) => {
  await serverSession(page, 'STUDENT');
  expect((await page.context().request.get('/dashboard', { maxRedirects: 0 })).status()).toBe(200);
  for (const route of ['/super-admin', '/school-admin']) expect((await page.context().request.get(route, { maxRedirects: 0 })).status()).toBe(307);
  await serverSession(page, 'SCHOOL_ADMIN');
  expect((await page.context().request.get('/school-admin', { maxRedirects: 0 })).status()).toBe(200);
  expect((await page.context().request.get('/super-admin', { maxRedirects: 0 })).status()).toBe(307);
  const fallback = await page.context().request.get('/super-admin/exams/edit/exam?tab=questions', { maxRedirects: 0 });
  expect(fallback.status()).toBe(307); expect(fallback.headers().location).toContain('/school-admin/exams/edit/exam?tab=questions');
  await serverSession(page, 'SUPER_ADMIN');
  expect((await page.context().request.get('/super-admin', { maxRedirects: 0 })).status()).toBe(200);
});

test('expired access can refresh through a valid httpOnly refresh cookie on direct navigation', async ({ page }) => {
  await page.context().addCookies([
    { name: 'auth_token', value: process.env.UI_TEST_EXPIRED_SESSION!, url: process.env.BASE_URL || 'http://localhost:3000', httpOnly: true },
    { name: 'auth_refresh', value: process.env.UI_TEST_REFRESH_SESSION!, url: process.env.BASE_URL || 'http://localhost:3000', httpOnly: true },
  ]);
  const response = await page.context().request.get('/dashboard', { maxRedirects: 0 });
  expect(response.status()).toBe(200);
  const cookie = (await page.context().cookies()).find(item => item.name === 'auth_token');
  expect(cookie?.httpOnly).toBe(true); expect(cookie?.value).not.toBe(process.env.UI_TEST_EXPIRED_SESSION);
});

test('a page already open is hidden and redirected when its session is lost', async ({ page }) => {
  await studentSession(page, 'en');
  await page.goto('/dashboard');
  await expect(page.getByText('Mathematics', { exact: true }).first()).toBeVisible();
  await page.context().clearCookies();
  await page.route('**/api/auth/me', route => route.fulfill({ status: 401, json: { error: 'Access denied. No token provided.' } }));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText('Mathematics', { exact: true })).toHaveCount(0);
});

test('private APIs reject unauthenticated requests independently of page guards', async ({ request }) => {
  for (const endpoint of ['/api/student/stats', '/api/super-admin/stats', '/api/admin/schools', '/api/notifications', '/api/ai/student/insight']) {
    const response = await request.get(endpoint); expect(response.status(), endpoint).toBe(401);
  }
});
