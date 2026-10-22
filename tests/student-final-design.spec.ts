import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { studentSession, lesson, report, course } from './helpers/studentWorkspace';

for (const language of ['ar','en']) test('calendar, assessments and reports match the student layout '+language, async ({page}) => {
  test.setTimeout(150000);
  await studentSession(page,language); await page.route('https://fonts.googleapis.com/**',r=>r.abort()); await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('**/api/reports/overview*',r=>r.fulfill({json:{...report,timeline:[{day:'2026-10-17',attempts:2,averageScore:65},{day:'2026-10-18',attempts:1,averageScore:80}],skills:[{name:'Reading',nameEn:'Reading',answers:10,correctRate:40,sufficientEvidence:true}]}}));
  await page.route('**/api/workspace/calendar*',r=>{const day=new URL(r.request().url()).searchParams.get('from');return r.fulfill({json:{events:[{id:'one',title:'المعادلات الخطية',kind:'LESSON_START',day,at:day+'T10:00:00Z',href:'/lessons/lesson?courseId=course',subject:'Math'},{id:'two',title:'اختبار اللغة العربية',kind:'EXAM_END',day,at:day+'T14:00:00Z',href:'/exams/exam/details',subject:'Arabic'}]}});});
  for(const width of [320,390,768,1264]) {
    await page.setViewportSize({width,height:900});
    for(const [path,name] of [['/calendar','calendar'],['/exams','assessments'],['/reports','reports']]) {
      await page.goto(path,{waitUntil:'domcontentloaded'});await expect(page.getByRole('heading',{level:1})).toBeVisible();
      if(path==='/reports') await expect(page.getByText(language==='ar'?'متوسط الدرجة':'Average score',{exact:true})).toBeVisible();
      if(path==='/calendar') await expect(page.getByText('المعادلات الخطية',{exact:true})).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if(width===390||width===1264) {
        const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
        expect(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
        await page.screenshot({path:`../artifacts/final-student-ui/${name}-${language}-${width}.png`,fullPage:true});
      }
    }
  }
});

for(const language of ['ar','en']) test('lesson explanation, assignments and quiz presentation '+language,async({page})=>{
  test.setTimeout(120000);await studentSession(page,language);await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.emulateMedia({reducedMotion:'reduce'});
  const item={id:'practice',text:'حل المعادلة س + 3 = 8',textEn:'Solve x + 3 = 8',type:'MCQ',options:['5','11','8','3'],correctAnswer:'5',skill:'المعادلات',level:'Easy',dok:'1'};
  const content={...lesson,questions:[item,{...item,id:'second'}],assignments:[{...item,id:'homework'}]};
  await page.route('**/api/lessons/lesson',r=>r.fulfill({json:content}));await page.route('**/api/courses/course*',r=>r.fulfill({json:{...course,lessons:[content]}}));
  for(const width of [320,390,1264]) {
    await page.setViewportSize({width,height:1000});await page.goto('/lessons/lesson?courseId=course',{waitUntil:'domcontentloaded'});
    const stages=page.getByRole('group',{name:language==='ar'?'مراحل الدرس':'Lesson stages'});await expect(stages).toBeVisible();
    for(const [index,stage] of ['slides','assignments','exercises'].entries()) {
      await stages.getByRole('button').nth(index).click();await expect(page.locator(`[data-lesson-stage="${stage}"]`)).toBeVisible();
      if(stage!=='slides') { const option=page.locator('[data-lesson-option]').first();await expect(option).toBeVisible();await option.click();await expect(option).toHaveAttribute('aria-pressed','true'); }
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if(width!==320){const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);await page.screenshot({path:`../artifacts/final-student-ui/lesson-${stage}-${language}-${width}.png`,fullPage:true});}
    }
  }
});

test('activity first answer saves, retries after failure and remains evaluated after reload',async({page})=>{
  await studentSession(page);await page.addInitScript(()=>localStorage.removeItem('lms_token'));await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.emulateMedia({reducedMotion:'reduce'});
  let saved=false,attempts=0;const activity={id:'activity',title:'Add two numbers',type:'MCQ',text:'Choose the sum',options:['4','5'],points:25,xpPoints:0,estimatedTime:0};
  await page.route('**/api/skills-hub/progress*',r=>r.fulfill({json:{grade:'Grade 3',subjects:['Math'],clusters:[{id:'cluster',name:'Mathematics',subject:'Math',skills:[{id:'skill',name:'Addition',activities:[{...activity,hasAttempt:saved,bestAttemptStars:saved?3:0,bestAttemptCorrect:saved}]}],stats:{totalActivities:1,completedActivities:saved?1:0,totalStarsEarned:saved?3:0,maxPossibleStars:3,masteryPercent:saved?100:0,totalXPEarned:0}}]}}));
  await page.route('**/api/skills-hub/activities/activity',r=>r.fulfill({json:activity}));
  await page.route('**/api/skills-hub/activities/activity/attempt',r=>{attempts++;expect(r.request().postDataJSON().selectedAnswer).toBe('4');expect(r.request().headers().authorization).toBeUndefined();if(attempts===1)return r.fulfill({status:503,json:{error:'Unavailable'}});saved=true;return r.fulfill({json:{attemptId:'saved',isCorrect:true,stars:3,score:25,earnedXP:0,currentStreak:1}});});
  await page.goto('/activities',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Open activity: Add two numbers',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Interactive activity'});await expect(dialog).toBeVisible();
  await dialog.getByRole('button').filter({hasText:'4'}).first().click();const confirm=dialog.getByRole('button',{name:'Confirm Answer',exact:true});await expect(confirm).toBeEnabled();await confirm.click();await expect(dialog.getByRole('alert')).toContainText('Could not submit');await expect(confirm).toBeEnabled();await confirm.click();await expect(dialog.getByRole('button',{name:'Finish Exercises',exact:true})).toBeVisible();await expect(page.getByText('+25 XP',{exact:true})).toHaveCount(0);expect(attempts).toBe(2);
  await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Open activity: Add two numbers',exact:true}).click();await expect(page.getByRole('button',{name:'Already Evaluated',exact:true})).toBeDisabled();
});
