import { test,expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { studentSession,exam,result } from './helpers/studentWorkspace';

const routes=['/dashboard','/courses','/courses/course','/lessons','/lessons/lesson?courseId=course','/exams','/exams/exam/details','/exams/exam','/exams/result/submission','/calendar','/reports','/activities','/profile','/settings'];
for(const language of ['en','ar'])for(const width of [390,1440]){
 test('student pages render without errors or overflow '+language+' '+width,async({page})=>{
  test.setTimeout(240000);await page.setViewportSize({width,height:900});await studentSession(page,language);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  for(const path of routes){await test.step(path,async()=>{
   await page.goto(path);await expect(page.locator('h1').first()).toBeVisible();await expect(page.locator('html')).toHaveAttribute('dir',language==='ar'?'rtl':'ltr');
   await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await expect(page.getByText('Application error:',{exact:false})).toHaveCount(0);
  });}
  expect(errors).toEqual([]);
 });
}
test('public home and login have usable Arabic/English forms and no dummy links',async({page})=>{
 for(const language of ['ar','en']){
  await page.addInitScript(language=>{localStorage.clear();localStorage.setItem('lms_lang',language);},language);
  await page.setViewportSize({width:390,height:844});await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();await expect(page.locator('a[href="#"]')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.goto('/login');await expect(page.locator('#student-username')).toBeVisible();
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(result.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
 }
});
test('mobile navigation reaches every student destination and restores keyboard focus',async({page})=>{
 await page.setViewportSize({width:390,height:844});await studentSession(page);await page.goto('/courses');
 const opener=page.getByRole('button',{name:'Menu & account',exact:true});await opener.click();
 const dialog=page.getByRole('dialog');for(const href of ['/calendar','/activities','/reports','/profile','/settings'])await expect(dialog.locator('a[href="'+href+'"]')).toBeVisible();
 await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(opener).toBeFocused();
 await page.getByRole('button',{name:'More',exact:true}).click();await page.getByRole('dialog').getByRole('link',{name:'Calendar',exact:true}).click();await expect(page).toHaveURL(/\/calendar$/);
});
test('exam availability never creates an empty result link, including nested sections',async({page})=>{
 await studentSession(page);
 await page.route('**/api/exams/exam?includeQuestions=false',route=>route.fulfill({json:{...exam,modules:[{id:'module',title:'Section',subExams:[{id:'upcoming',title:'Upcoming child',publishDate:'2099-01-01T00:00:00Z',attemptsAllowed:1}],subModules:[{id:'nested',title:'Nested section',subExams:[{id:'closed',title:'Closed child',cutOffDate:'2020-01-01T00:00:00Z',attemptsAllowed:1}]}]}]}}));
 await page.goto('/exams/exam/details');await expect(page.getByRole('heading',{name:'Upcoming child'})).toBeVisible();
 await expect(page.locator('a[href="/exams/result/"]')).toHaveCount(0);await expect(page.getByRole('link',{name:'Start exam',exact:true})).toHaveCount(0);
 await expect(page.getByText('The submission period has ended.',{exact:true})).toBeVisible();
});
test('completed attempts link to the actual latest result',async({page})=>{
 await studentSession(page);
 await page.route('**/api/exams/exam?includeQuestions=false',route=>route.fulfill({json:{...exam,attemptsAllowed:1,submissions:[{id:'submission',subExamId:null,createdAt:'2026-01-01T00:00:00Z'}]}}));
 await page.goto('/exams/exam/details');await expect(page.getByRole('link',{name:'Latest result'})).toHaveAttribute('href','/exams/result/submission');await expect(page.getByRole('link',{name:'Start exam',exact:true})).toHaveCount(0);
});
test('course filters clear correctly and scheduled lessons cannot be started',async({page})=>{
 await studentSession(page);await page.goto('/courses');await page.getByLabel('Search courses').fill('unknown');await expect(page.getByRole('heading',{name:'No matching courses'})).toBeVisible();
 await page.getByRole('button',{name:'Clear filters'}).click();await page.getByRole('link',{name:'Continue learning',exact:true}).click();await expect(page).toHaveURL(/\/courses\/course$/);
 await expect(page.getByRole('link',{name:'Continue learning',exact:true})).toHaveAttribute('href','/lessons/lesson?courseId=course');
 await expect(page.locator('a[href*="future-lesson"]')).toHaveCount(0);
});
test('failed exam submission retains answers and can retry successfully',async({page})=>{
 await studentSession(page);let submits=0;let body:any;
 await page.route('**/api/exams/exam/submit',async route=>{submits++;body=route.request().postDataJSON();return submits===1?route.fulfill({status:503,json:{error:'Unavailable'}}):route.fulfill({json:{submissionId:'submission'}});});
 await page.goto('/exams/exam');await page.getByRole('button',{name:'Start Exam Now',exact:true}).click();
 await page.emulateMedia({reducedMotion:'reduce'});const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations.map(v=>v.id)).toEqual([]);
 await page.getByRole('button').filter({hasText:'Choice A'}).first().click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('exam_exam_root_answers')||'[]').length)).toBe(1);
 await page.getByRole('button',{name:'Next',exact:true}).click();
 await page.getByRole('button',{name:'Submit Final Exam',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Yes, Submit Now',exact:true}).click();
 await expect(page.getByRole('alert').filter({hasText:'Submission was not confirmed'})).toBeVisible();
 expect(body.answers).toHaveLength(1);await page.getByRole('button',{name:'Retry submission',exact:true}).click();await expect(page).toHaveURL(/\/exams\/result\/submission$/);expect(body.answers[0].selectedAnswer).toBe('Choice A');
});
test('result retry and answer filters preserve the saved grade',async({page})=>{
 await studentSession(page);let loadFails=true;await page.route('**/api/exams/submissions/submission',route=>loadFails?route.fulfill({status:500,json:{error:'Unavailable'}}):route.fulfill({json:result}));
 await page.goto('/exams/result/submission');await expect(page.getByRole('button',{name:'Retry',exact:true})).toBeVisible();loadFails=false;await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByText('50%',{exact:true})).toBeVisible();
 await page.getByLabel('Show answers').selectOption('incorrect');await expect(page.getByText('First question',{exact:true})).toHaveCount(0);await expect(page.getByText('Second question',{exact:true})).toBeVisible();await expect(page.getByText('50%',{exact:true})).toBeVisible();
});
test('password mismatch blocks submission and visibility control is accessible',async({page})=>{
 await studentSession(page);let requests=0;await page.route('**/api/auth/change-password',route=>{requests++;return route.fulfill({json:{success:true}});});
 await page.goto('/settings');await page.getByLabel('Current password',{exact:true}).fill('current-password');await page.getByLabel('New password',{exact:true}).fill('new-password-123');await page.getByLabel('Confirm password',{exact:true}).fill('wrong-password-123');
 await page.getByRole('button',{name:'Save password',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'Passwords do not match'})).toBeVisible();expect(requests).toBe(0);
 await page.getByRole('button',{name:'Show passwords',exact:true}).click();await expect(page.getByLabel('New password',{exact:true})).toHaveAttribute('type','text');
});
test('key student pages satisfy WCAG automated checks in English',async({page})=>{
 test.setTimeout(180000);await page.setViewportSize({width:390,height:844});await studentSession(page);await page.emulateMedia({reducedMotion:'reduce'});
 for(const path of ['/dashboard','/courses','/courses/course','/lessons/lesson?courseId=course','/exams','/exams/exam/details','/exams/result/submission','/calendar','/reports','/activities','/profile','/settings']){
  await page.goto(path);await expect(page.locator('h1')).toBeVisible();const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(audit.violations.map(v=>({path,id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
 }
});

test('Arabic student accessibility and responsive visual review',async({page})=>{
 test.setTimeout(180000);await studentSession(page,'ar');await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});
 for(const [path,name] of [['/courses','courses-ar-mobile'],['/courses/course','course-ar-mobile'],['/calendar','calendar-ar-mobile'],['/settings','settings-ar-mobile']]){
  await page.goto(path);await expect(page.locator('h1')).toBeVisible();const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(audit.violations.map(v=>({path,id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
  await page.screenshot({path:'../artifacts/student-ui/'+name+'.png',fullPage:true});
 }
 await page.setViewportSize({width:1440,height:1000});await page.goto('/dashboard');await expect(page.getByRole('heading',{name:/Student/})).toBeVisible();await page.screenshot({path:'../artifacts/student-ui/dashboard-ar-desktop.png',fullPage:true});
 await page.goto('/lessons/lesson?courseId=course');await expect(page.getByRole('heading',{name:'Study lesson',exact:true})).toBeVisible();await page.screenshot({path:'../artifacts/student-ui/lesson-ar-desktop.png',fullPage:true});
});
test('calendar presets and retired assignment links stay actionable',async({page})=>{
 await studentSession(page);await page.goto('/calendar');await page.getByRole('button',{name:'Today',exact:true}).click();
 await expect(page.getByText('Upcoming lesson',{exact:true})).toBeVisible();
 await page.goto('/assignments');await expect(page).toHaveURL(/\/exams$/);await expect(page.locator('a[href="/assignments"]')).toHaveCount(0);
});

