import { test, expect } from '@playwright/test';
import { studentSession, exam } from './helpers/studentWorkspace';

for (const language of ['ar', 'en']) {
  test(`landing refresh keeps honest reviews, local imagery and working app CTA ${language}`, async ({ page }) => {
    test.setTimeout(90000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(language => { localStorage.setItem('lms_lang', language); localStorage.setItem('klevro-install-dismissed', String(Date.now())); }, language);
    await page.route('https://fonts.googleapis.com/**', r => r.abort());
    await page.route('**/api/ai/public/config', r => r.fulfill({ json: { enabled: false } }));
    for (const width of [390, 1480]) {
      await page.setViewportSize({ width, height: 850 }); await page.goto('/');
      await expect(page.locator('#about h2')).toBeVisible();
      const photo = page.locator('#about img'); await photo.scrollIntoViewIfNeeded();
      await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
      const communityPhoto = page.locator('#for-everyone img');
      await communityPhoto.scrollIntoViewIfNeeded();
      await expect.poll(() => communityPhoto.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
      await expect(photo).toHaveAttribute('src', /q=90/);
      await expect(communityPhoto).toHaveAttribute('src', /q=90/);
      for (const section of ['learning-experience', 'learning-companion']) {
        const image = page.locator(`#${section} figure img`);
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
        if (width === 1480) expect(await image.evaluate((img: HTMLImageElement) => Number(new URL(img.currentSrc).searchParams.get('w')))).toBeGreaterThanOrEqual(1000);
        await expect(image).toHaveAttribute('src', /q=90/);
        await page.locator(`#${section}`).screenshot({ path: `../artifacts/landing-refresh/${section}-${language}-${width}.png` });
      }
      await expect(page.locator('[class*="lessonSheet"], [class*="previewQuestion"]')).toHaveCount(0);
      await expect(page.locator('main')).not.toContainText(/صورة.*مولّدة|AI-generated illustrative image/);
      await page.locator('#for-everyone').screenshot({ path: `../artifacts/landing-refresh/community-${language}-${width}.png` });
      await expect(page.locator('#community-reviews')).toContainText(language === 'ar' ? 'لم تُنشر آراء بعد' : 'No reviews have been published');
      expect(await page.locator('[class*="promise"]').evaluate(el => getComputedStyle(el, '::before').display)).toBe('none');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `../artifacts/landing-refresh/home-${language}-${width}.png`, fullPage: true });
      await page.getByRole('button', { name: language === 'ar' ? 'ثبّت تطبيق Klevro' : 'Install Klevro', exact: true }).click();
      await expect(page.getByRole('complementary', { name: language === 'ar' ? 'تثبيت تطبيق Klevro' : 'Install Klevro' })).toBeVisible();
      await page.getByRole('button', { name: language === 'ar' ? 'إخفاء دعوة التثبيت' : 'Dismiss installation invitation' }).click();
    }
  });
  test(`all exam cards keep matching actions and readable app titles ${language}`, async ({ page }) => {
    test.setTimeout(90000); await studentSession(page, language);
    await page.addInitScript(() => localStorage.setItem('klevro-install-dismissed', String(Date.now())));
    await page.route('https://fonts.googleapis.com/**', r => r.abort());
    await page.route('**/api/exams/exam?includeQuestions=false', r => r.fulfill({ json: { ...exam, title: 'BIOLOGY FOUNDATION', titleEn: 'BIOLOGY FOUNDATION', modules: [{ id: 'module', title: 'BIOLOGY FOUNDATION', subExams: ['Nature of Biology', 'Characteristics of Life', 'Levels of Biological Organization'].map((title, index) => ({ id: `sub-${index}`, title, duration: 60, questionsCount: 20, attemptsAllowed: 2 })) }] } }));
    for (const width of [390, 1080]) {
      await page.setViewportSize({ width, height: 850 }); await page.goto('/exams/exam/details');
      const cards = page.locator('[data-attempt-state]'); await expect(cards).toHaveCount(3);
      const positions: number[] = [];
      for (const card of await cards.all()) {
        const link = card.getByRole('link', { name: language === 'ar' ? 'ابدأ الاختبار' : 'Start exam', exact: true });
        await expect(link).toBeVisible();
        const cb = (await card.boundingBox())!, lb = (await link.boundingBox())!;
        expect(cb.width).toBeGreaterThan((await page.locator('[class*="examPanel"]').boundingBox())!.width * .85);
        positions.push(language === 'ar' ? cb.x + cb.width - lb.x - lb.width : lb.x - cb.x);
        await expect(link).toHaveAttribute('href', /subExamId=sub-/);
      }
      expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(2);
      const title = page.locator('h1'); expect((await title.boundingBox())!.width).toBeGreaterThan(200);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `../artifacts/landing-refresh/exam-${language}-${width}.png`, fullPage: true });
      if (width === 1080) {
        await page.locator('main>div').first().evaluate(el => { (el as HTMLElement).style.width = '380px'; });
        expect((await title.boundingBox())!.width).toBeGreaterThan(180);
      }
    }
  });
}
