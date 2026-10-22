import { test,expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { studentSession,course,lesson,exam,stamp } from './helpers/studentWorkspace';
const lessons=[
 {...lesson,id:'done-1',title:'المجموعات والعمليات عليها',domain:'الجبر والأعداد',durationSeconds:900,progresses:[{isCompleted:true}]},
 {...lesson,id:'done-2',title:'المعادلات الخطية',domain:'الجبر والأعداد',durationSeconds:1020,progresses:[{isCompleted:true}]},
 {...lesson,id:'done-3',title:'الأسس والقوى',domain:'الجبر والأعداد',durationSeconds:1140,progresses:[{isCompleted:true}]},
 {...lesson,id:'lesson',title:'Study lesson',domain:'الجبر والأعداد',durationSeconds:1260,progresses:[]},
 {...lesson,id:'scheduled',title:'Scheduled lesson',domain:'المراجعة',publishDate:'2099-01-01T00:00:00Z',progresses:[]},
];
const courseData={...course,title:'الرياضيات — تجربة آدم — أولى ثانوي',subject:'Math',description:'تابع دروسك وتقدمك في المقرر.',lessons,xpData:{totalCourseXP:130}};
const unitExam={...exam,title:'الوحدة الأولى — اللغة الإنجليزية',subjects:'اللغة الإنجليزية',startDate:'2020-01-01T10:00:00Z',attemptsAllowed:2,submissions:[{id:'real-result',subExamId:'done',createdAt:stamp}],modules:[{id:'unit',title:'الوحدة الأولى — اللغة الإنجليزية',subExams:[{id:'done',title:'اختبار فرعي محلول',duration:10,questionsCount:4,attemptsAllowed:1},{id:'available',title:'اختبار فرعي متاح',duration:10,questionsCount:4,attemptsAllowed:2},{id:'upcoming',title:'اختبار فرعي قادم',duration:10,questionsCount:4,attemptsAllowed:2,publishDate:'2099-01-01T10:00:00Z'}],subModules:[{id:'review',parentModuleId:'unit',title:'قسم فرعي — مراجعة إضافية',subExams:[{id:'review-upcoming',title:'اختبار مراجعة قادم',duration:10,questionsCount:4,publishDate:'2099-01-02T10:00:00Z',attemptsAllowed:2}]}]}]};
for(const language of ['ar','en'])test(`course, lesson and exam details follow the references ${language}`,async({page})=>{
 test.setTimeout(180000);await studentSession(page,language);await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/api/courses/course*',r=>r.fulfill({json:courseData}));await page.route('**/api/student/stats',r=>r.fulfill({json:{courseProgresses:[{...course,progressPercent:75}]}}));await page.route('**/api/exams/exam?includeQuestions=false',r=>r.fulfill({json:unitExam}));const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,390,768,1264,1536]){
  await page.setViewportSize({width,height:width<600?844:1000});
  for(const [path,name] of [['/courses/course','course'],['/lessons/lesson?courseId=course','lesson'],['/exams/exam/details','exam-details']]){
   await page.goto(path,{waitUntil:'domcontentloaded'});await expect(page.locator('h1')).toBeVisible();await expect(page.locator('[data-learning-backdrop]')).toHaveCount(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   if(name==='course'){await expect(page.getByRole('progressbar')).toHaveAttribute('value','75');await expect(page.locator('[data-lesson-state="completed"]')).toHaveCount(3);await expect(page.locator('[data-lesson-state="locked"] a')).toHaveCount(0);await expect(page.getByRole('link',{name:language==='ar'?'أكمل دراستك':'Continue learning',exact:true})).toHaveAttribute('href','/lessons/lesson?courseId=course');}
   if(name==='exam-details'){await expect(page.locator('[data-attempt-state]')).toHaveCount(4);await expect(page.getByRole('link',{name:language==='ar'?'نتيجة آخر محاولة':'Latest result',exact:true})).toHaveAttribute('href','/exams/result/real-result');await expect(page.getByRole('link',{name:language==='ar'?'ابدأ الاختبار':'Start exam',exact:true})).toHaveAttribute('href','/exams/exam?subExamId=available');await expect(page.locator('[data-attempt-state="UPCOMING"] a')).toHaveCount(0);}
   if(width===390||width===1264){const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);await page.screenshot({path:`../artifacts/learning-ui/${name}-${language}-${width}.png`,fullPage:true});}
  }
 }
 expect(errors).toEqual([]);
});

test('course groups collapse and lesson navigation, slides and keyboard controls remain usable',async({page})=>{
 await studentSession(page);await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.emulateMedia({reducedMotion:'reduce'});await page.route('**/api/courses/course*',r=>r.fulfill({json:courseData}));await page.goto('/courses/course',{waitUntil:'domcontentloaded'});
 await page.getByText('الجبر والأعداد',{exact:false}).first().click();await expect(page.getByRole('heading',{name:/المجموعات والعمليات/})).not.toBeVisible();await page.getByText('الجبر والأعداد',{exact:false}).first().click();
 await page.getByRole('link',{name:'Continue learning',exact:true}).click();await expect(page.getByRole('heading',{name:'Study lesson',exact:true})).toBeVisible();await page.getByRole('button',{name:'Show Explanation',exact:true}).click();await expect(page.getByText('Read this lesson.',{exact:true}).first()).toBeVisible();await expect(page.getByRole('group',{name:'Lesson stages'})).toBeVisible();await expect(page.getByLabel('Choose a course lesson')).toHaveValue('lesson');await expect(page.getByRole('option',{name:/Scheduled lesson/})).toBeDisabled();
});
