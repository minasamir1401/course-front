import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { studentSession, report } from './helpers/studentWorkspace';

const timeline = [50,75,55,95,85,80,30].map((averageScore,index)=>({day:`2026-10-${14+index}`,attempts:2,averageScore,minimumScore:averageScore-10,maximumScore:averageScore+5,passRate:50}));
const fixture={...report,timeline,skills:[{name:'Fractions',nameEn:'Fractions',answers:10,correctRate:40,sufficientEvidence:true},{name:'Addition',nameEn:'Addition',answers:8,correctRate:25,sufficientEvidence:true},{name:'Limited evidence',answers:1,correctRate:0,sufficientEvidence:false}]};
for(const language of ['ar','en']) test(`report reference layout, real chart and controls ${language}`,async({page})=>{
  test.setTimeout(120000); await studentSession(page,language); await page.route('https://fonts.googleapis.com/**',route=>route.abort());await page.emulateMedia({reducedMotion:'reduce'});
  const queries:string[]=[];await page.route('**/api/reports/overview*',route=>{queries.push(route.request().url());return route.fulfill({json:fixture});});
  let exportUrl='';await page.route('**/api/reports/export*',route=>{exportUrl=route.request().url();return route.fulfill({status:200,contentType:'text/csv',body:'Exam,Score\nSchool exam,50'});});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  for(const width of [320,390,768,1264,1536]){
    await page.setViewportSize({width,height:960});await page.goto('/reports',{waitUntil:'domcontentloaded'});
    await expect(page.getByRole('heading',{name:language==='ar'?'متوسط الدرجة':'Average score',exact:true})).toBeVisible();
    await expect(page.locator('[class*="metricCard"]')).toHaveCount(4);await expect(page.locator('[class*="priorityRow"]')).toHaveCount(2);
    await expect(page.locator('.recharts-bar-rectangle')).toHaveCount(14);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(width===390||width===1264){
      const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
      await page.screenshot({path:`../artifacts/reports-reference/report-${language}-${width}.png`,fullPage:true});
    }
  }
  const from=page.locator('input[type=date]').first();await from.fill('2026-10-01');const before=queries.length;await page.waitForTimeout(150);expect(queries.length).toBe(before);
  await page.getByRole('button',{name:language==='ar'?'تطبيق الفلاتر':'Apply filters',exact:true}).click();await expect.poll(()=>queries.some(url=>new URL(url).searchParams.get('from')==='2026-10-01')).toBe(true);
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'CSV',exact:true}).click();await download;expect(new URL(exportUrl).searchParams.get('from')).toBe('2026-10-01');
  await page.getByRole('button',{name:language==='ar'?'اعرض تفاصيل المهارات':'View skill details',exact:true}).click();await expect(page.getByRole('region',{name:language==='ar'?'أداء المهارات':'Skill performance',exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

for(const reduced of [false,true])test(`landing motion is finite, accessible and reveals content reduced=${reduced}`,async({page})=>{
  test.setTimeout(60000);await page.route('https://fonts.googleapis.com/**',route=>route.abort());await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});await page.goto('/',{waitUntil:'domcontentloaded'});const root=page.locator('main').locator('..');await expect(page.getByRole('button',{name:'التبديل للإنجليزية',exact:true})).toBeEnabled();
  const art=page.locator('[aria-labelledby="landing-title"] img');
  if(reduced){await expect(root).not.toHaveAttribute('data-motion','ready');expect(await art.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');}
  else{await expect(root).toHaveAttribute('data-motion','ready');expect(await art.evaluate(el=>getComputedStyle(el).animationIterationCount)).toBe('1');expect(await art.evaluate(el=>Number.parseFloat(getComputedStyle(el).animationDuration))).toBeLessThanOrEqual(5);
    for(const element of await page.locator('[data-reveal]').all()){await element.scrollIntoViewIfNeeded();await expect(element).toHaveAttribute('data-revealed','true');await expect.poll(()=>element.evaluate(el=>Number(getComputedStyle(el).opacity))).toBe(1);}
  }
  await page.getByRole('tab').nth(1).click();await expect(page.getByRole('tabpanel')).toContainText('التقارير');
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
});
