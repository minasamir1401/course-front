import { expect, test } from '@playwright/test';

test.describe('local LMS smoke and regression checks', () => {
  test('landing page loads without a visible runtime error', async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator('body')).not.toContainText('Application error');
    expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
  });

  test('login page is reachable and has one primary form', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('form')).toHaveCount(1);
    await expect(page.locator('input').first()).toBeVisible();
  });

  for (const route of ['/courses', '/exams', '/school-admin/login', '/super-admin/login']) {
    test(`${route} does not duplicate the document title`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const title = await page.title();
      expect(title.trim()).not.toBe('');
      expect(await page.locator('title').count()).toBe(1);
    });
  }
});
