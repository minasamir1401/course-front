import { test, expect } from '@playwright/test';

for (const language of ['ar','en']) test(`mobile landing has readable cards, working pathways and reachable actions ${language}`, async ({ browser }) => {
  test.setTimeout(120000);
  const context=await browser.newContext({baseURL:process.env.BASE_URL||'http://localhost:3000',isMobile:true,hasTouch:true,deviceScaleFactor:2,viewport:{width:390,height:844}});
  try {
    const page=await context.newPage();
    await page.addInitScript(language=>{localStorage.setItem('lms_lang',language);localStorage.setItem('klevro-install-dismissed',String(Date.now()));},language);
    await page.route('https://fonts.googleapis.com/**',r=>r.abort());
    await page.route('**/api/ai/public/config',r=>r.fulfill({json:{enabled:true}}));
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const width of [320,375,430]){
      await page.setViewportSize({width,height:844});await page.goto('/');
      const primary=page.locator('[class*="heroActions"] a[href="/login"]');
      await expect(primary).toBeVisible();
      expect((await primary.boundingBox())!.y+(await primary.boundingBox())!.height).toBeLessThan(700);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      const pathways=page.getByRole('region',{name:language==='ar'?'المسارات التعليمية':'Learning pathways'});
      await pathways.scrollIntoViewIfNeeded();
      expect(await pathways.evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);
      const before=await pathways.evaluate(el=>el.scrollLeft);
      await pathways.evaluate((el,language)=>el.scrollBy({left:(language==='ar'?-1:1)*el.clientWidth,behavior:'instant'}),language);
      await expect.poll(()=>pathways.evaluate(el=>Math.abs(el.scrollLeft))).toBeGreaterThan(Math.abs(before)+100);
      await page.getByRole('tab').nth(1).click();
      await expect(page.getByRole('tabpanel')).toContainText(language==='ar'?'التقارير':'reports');
      await page.locator('summary').first().click();await expect(page.locator('details').first()).toHaveAttribute('open','');
      const assistant=page.getByRole('button',{name:language==='ar'?'افتح مساعد Klevro':'Open Klevro assistant',exact:true});
      await expect(assistant).toBeVisible();expect((await assistant.boundingBox())!.width).toBeLessThan(60);
      if(width===375){
        await page.evaluate(()=>scrollTo(0,0));
        await page.screenshot({path:`../artifacts/landing-mobile/first-fold-${language}.png`});
        await page.locator('#about').screenshot({path:`../artifacts/landing-mobile/about-${language}.png`});
      }
    }
  } finally { await context.close(); }
});
