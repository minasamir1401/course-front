import { test,expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { studentSession,exam,course } from './helpers/studentWorkspace';

const exams=[
 {...exam,id:'completed',title:'اختبار الرياضيات المحلول',titleEn:'Completed mathematics assessment',subjects:'["Mathematics"]',attemptsAllowed:1,questionsCount:4,startDate:'2020-01-01T10:00:00Z',submissions:[{id:'saved-result',createdAt:'2026-10-01T10:00:00Z'}]},
 {...exam,id:'available',title:'اختبار اللغة العربية',titleEn:'Arabic assessment',subjects:'اللغة العربية',questionsCount:4,attemptsAllowed:2,submissions:[]},
 {...exam,id:'upcoming',title:'اختبار اللغة الإنجليزية القادم',titleEn:'Upcoming English assessment',subjects:'["اللغة الإنجليزية"]',questionsCount:4,startDate:'2099-01-01T10:00:00Z',endDate:'2099-01-02T10:00:00Z'},
 {...exam,id:'closed',title:'اختبار العلوم المغلق',titleEn:'Closed science assessment',subjects:'العلوم',endDate:'2020-01-01T10:00:00Z'},
];
for(const language of ['ar','en'])test(`exam reference cards use real states, subject artwork and responsive layout ${language}`,async({page})=>{
 test.setTimeout(150000);await studentSession(page,language);await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('**/api/exams',r=>r.fulfill({json:exams}));const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,390,768,1011,1264,1536]){
  await page.setViewportSize({width,height:width<600?844:1000});await page.goto('/exams',{waitUntil:'domcontentloaded'});await expect(page.locator('[data-exam-state]')).toHaveCount(4);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('[data-exam-state="COMPLETED"] a[href="/exams/result/saved-result"]')).toBeVisible();
  await expect(page.locator('[data-exam-state="UPCOMING"]')).not.toContainText(language==='ar'?'ابدأ الاختبار':'Start exam');
  await expect(page.locator('[data-exam-state="CLOSED"]')).not.toContainText(language==='ar'?'ابدأ الاختبار':'Start exam');
  await expect(page.locator('[data-exam-state="AVAILABLE"] [data-subject="arabic"]')).toBeVisible();
  await expect(page.locator('a[href="/exams/result/"]')).toHaveCount(0);
  if(width===390||width===1264){for(const artwork of await page.locator('[data-subject]').all())await artwork.scrollIntoViewIfNeeded();await page.evaluate(()=>window.scrollTo(0,0));const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);await page.screenshot({path:`../artifacts/exams-ui/exams-${language}-${width}.png`,fullPage:true});}
 }
 expect(errors).toEqual([]);
});

test('exam filters, empty state and recovery keep actions working',async({page})=>{
 await studentSession(page);await page.route('https://fonts.googleapis.com/**',r=>r.abort());let fail=false;await page.route('**/api/exams',r=>fail?r.fulfill({status:503,json:{error:'Unavailable'}}):r.fulfill({json:exams}));await page.goto('/exams',{waitUntil:'domcontentloaded'});
 await page.getByLabel('Status',{exact:true}).selectOption('UPCOMING');await expect(page.locator('[data-exam-state]')).toHaveCount(1);await page.getByLabel('Search exams',{exact:true}).fill('missing');await expect(page.getByRole('heading',{name:'No matching exams'})).toBeVisible();await page.getByRole('button',{name:'Clear filters',exact:true}).click();await expect(page.locator('[data-exam-state]')).toHaveCount(4);
 fail=true;await page.reload({waitUntil:'domcontentloaded'});await expect(page.getByRole('button',{name:'Retry',exact:true})).toBeVisible();fail=false;await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.locator('[data-exam-state]')).toHaveCount(4);await expect(page.getByRole('link',{name:'Start exam',exact:true})).toHaveAttribute('href','/exams/available/details');
});

test('lesson header reuses its course subject and uploaded cover',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await studentSession(page);await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('**/api/courses/course?summary=true',r=>r.fulfill({json:{...course,subject:'Math',coverImage:'/klevro/subjects/arabic.webp'}}));
 await page.setViewportSize({width:390,height:844});await page.goto('/lessons/lesson?courseId=course',{waitUntil:'domcontentloaded'});await expect(page.getByRole('heading',{name:'Study lesson',exact:true})).toBeVisible();await expect(page.locator('[data-subject="mathematics"]')).toHaveAttribute('data-custom-cover','true');await expect(page.locator('[data-subject="mathematics"] img')).toHaveAttribute('src',/arabic/);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);await page.screenshot({path:'../artifacts/exams-ui/lesson-course-cover.png',fullPage:true});
});
