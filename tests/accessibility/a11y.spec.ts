import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const route of ['/', '/login', '/school-admin/login', '/super-admin/login']) {
  test(`axe accessibility scan: ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.locator('main').waitFor({ state: 'attached', timeout: 10_000 });
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, results.violations.map(v => `${v.id}: ${v.help}`).join('\n')).toEqual([]);
  });
}
