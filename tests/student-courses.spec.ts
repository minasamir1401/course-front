import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getSubjectArtwork, parseSubjects, SUBJECT_CATALOG } from '../src/lib/subjectArtwork';
import { studentSession, course, exam, stamp } from './helpers/studentWorkspace';

const subjects=['العلوم','اللغة الإنجليزية','الرياضيات','اللغة العربية','التربية الرياضية','التربية الفنية','تقنية المعلومات','الدراسات الاجتماعية'];
const progresses=[100,55,40,65,0,25,0,30];
const courses=subjects.map((subject,index)=>({...course,id:index===2?'course':`course-${index}`,title:subject,subject,progressPercent:progresses[index]}));
const stats={name:'آدم — تجريبي',grade:'أولى ثانوي',overallCourseProgress:38,avgScore:68.8,passRate:75,totalExams:9,xp:370,courseProgresses:courses,upcomingTasks:[{id:'exam',title:'امتحان الرياضيات',subject:'["Mathematics"]',startDate:'2099-01-01T10:00:00Z'}],generatedAt:stamp};

test('subject catalog recognizes saved Arabic/English formats and includes local assets',()=>{
 for(const value of ['MATH','Math','Mathematics','["Mathematics"]','الرِّيَاضِيَّات',['الرياضيات']])expect(getSubjectArtwork(value).key).toBe('mathematics');
 expect(getSubjectArtwork('["اللغة الإنجليزية"]')).toMatchObject({key:'english'});
 expect(getSubjectArtwork('اللغة العربية','Mathematics')).toMatchObject({key:'arabic'});
 expect(getSubjectArtwork(['Unknown','Science'])).toMatchObject({key:'science'});
 expect(getSubjectArtwork('[]','English reading')).toMatchObject({key:'english'});
 expect(getSubjectArtwork('Unlisted subject','English')).toMatchObject({key:'general'});
 expect(getSubjectArtwork('IT')).toMatchObject({key:'computing'});
 expect(parseSubjects(null)).toEqual([]);expect(parseSubjects('["Math","العلوم"]')).toEqual(['Math','العلوم']);
 for(const item of SUBJECT_CATALOG){expect(getSubjectArtwork(item.ar).key).toBe(item.key);expect(existsSync(resolve(__dirname,'../public',getSubjectArtwork(item.ar).src.slice(1)))).toBe(true);}
});

for(const language of ['ar','en'])test(`courses reference layout, readable covers and accessibility ${language}`,async({page})=>{
 test.setTimeout(180000);await studentSession(page,language);await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('**/api/student/stats',r=>r.fulfill({json:stats}));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,390,768,1011,1264,1536]){
  await page.setViewportSize({width,height:width<600?844:928});await page.goto('/courses',{waitUntil:'domcontentloaded'});await expect(page.locator('[data-subject]')).toHaveCount(8);
  for(const artwork of await page.locator('[data-subject]').all())await artwork.scrollIntoViewIfNeeded();
  await page.evaluate(()=>window.scrollTo(0,0));
  await expect.poll(()=>page.locator('[data-subject] img').evaluateAll(images=>images.every(image=>(image as HTMLImageElement).complete&&(image as HTMLImageElement).naturalWidth>0))).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('[class*="metrics"] article')).toHaveCount(4);
  if(width===390||width===1264){const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);await page.screenshot({path:`../artifacts/courses-ui/courses-${language}-${width}.png`,fullPage:true});}
 }
 expect(errors).toEqual([]);
});

test('course search, subject aliases and counted status filters combine and reset',async({page})=>{
 await studentSession(page);await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('**/api/student/stats',r=>r.fulfill({json:{...stats,courseProgresses:[...courses,{...course,id:'math-two',subject:'MATH',progressPercent:0}]}}));
 await page.goto('/courses',{waitUntil:'domcontentloaded'});await expect(page.locator('[data-subject]')).toHaveCount(9);
 await page.getByLabel('Subject',{exact:true}).selectOption('mathematics');await expect(page.locator('[data-subject]')).toHaveCount(2);await expect(page.getByRole('option',{name:'Mathematics',exact:true})).toHaveCount(1);
 await page.getByRole('button',{name:'Not started (1)',exact:true}).click();await expect(page.locator('[data-subject]')).toHaveCount(1);
 await page.getByLabel('Search courses').fill('unknown');await expect(page.getByRole('heading',{name:'No matching courses'})).toBeVisible();
 await page.getByRole('button',{name:'Clear filters'}).click();await expect(page.locator('[data-subject]')).toHaveCount(9);await expect(page.getByRole('button',{name:'All courses (9)',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('article').filter({has:page.getByRole('heading',{name:'العلوم',exact:true})}).getByRole('link')).toHaveText('Review course');
});

test('same subject artwork reaches dashboard and exam list, custom covers and fallback work',async({page})=>{
 await studentSession(page);await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('**/api/student/stats',r=>r.fulfill({json:stats}));await page.route('**/api/exams',r=>r.fulfill({json:[{...exam,subjects:'["الرياضيات"]'}]}));
 await page.goto('/dashboard',{waitUntil:'domcontentloaded'});await expect(page.locator('a[href="/exams/exam/details"] [data-subject="mathematics"]')).toBeVisible();
 await expect(page.locator('[class*="courseRow"] [data-subject="mathematics"]')).toBeVisible();
 await page.goto('/exams',{waitUntil:'domcontentloaded'});await expect(page.locator('[data-subject="mathematics"]')).toBeVisible();
 await expect(page.locator('[data-subject] img')).toHaveAttribute('src',/mathematics/);
 await page.route('**/api/student/stats',r=>r.fulfill({json:{...stats,courseProgresses:[{...course,coverImage:'/klevro/subjects/art.webp'},{...course,id:'broken',coverImage:'http://localhost:3000/missing-cover.png'}]}}));await page.route('**/missing-cover.png',r=>r.fulfill({status:404,body:''}));
 await page.goto('/courses',{waitUntil:'domcontentloaded'});await expect(page.locator('article').filter({has:page.locator('a[href="/courses/course"]')}).locator('[data-subject] img')).toHaveAttribute('src',/art/);await expect(page.locator('article').filter({has:page.locator('a[href="/courses/broken"]')}).locator('[data-subject]')).toHaveAttribute('data-custom-cover','false');await expect(page.locator('[data-custom-cover="false"] img')).toHaveAttribute('src',/mathematics/);
});

test('no courses, no exam scores and refresh errors retain useful states',async({page})=>{
 await studentSession(page);await page.route('https://fonts.googleapis.com/**',r=>r.abort());let fails=false;await page.route('**/api/student/stats',r=>fails?r.fulfill({status:503,json:{error:'Unavailable'}}):r.fulfill({json:{...stats,avgScore:null,passRate:null,totalExams:0,overallCourseProgress:0,courseProgresses:[]}}));
 await page.goto('/courses',{waitUntil:'domcontentloaded'});await expect(page.getByRole('heading',{name:'No courses assigned yet'})).toBeVisible();await expect(page.locator('[class*="metric"]>strong').filter({hasText:'—'})).toHaveCount(2);
 fails=true;await page.reload({waitUntil:'domcontentloaded'});await expect(page.getByText('Could not refresh your courses. Please retry.')).toBeVisible();await expect(page.getByRole('heading',{name:'No courses assigned yet'})).toBeVisible();fails=false;await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByText('Could not refresh your courses. Please retry.')).toHaveCount(0);
});
