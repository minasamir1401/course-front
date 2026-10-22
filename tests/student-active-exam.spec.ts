import { test,expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { studentSession,exam,questions } from './helpers/studentWorkspace';

const assessment={...exam,title:'اللغة العربية — واجب تطبيقي — تجربة آدم',titleEn:'Arabic — reading comprehension assessment',type:'Assignment',section:'الفهم القرائي',sectionEn:'Reading comprehension',subjects:'اللغة العربية',questions:[
 {...questions[0],text:'ما الفكرة الرئيسية للنص: «يقسّم الطالب يومه بين الدراسة والراحة»؟',textEn:'What is the main idea of a text about balancing study and rest?',options:['تنظيم الوقت','السفر','المنافسة','الرياضة'],optionsEn:['Time management','Travel','Competition','Sports'],correctAnswer:'تنظيم الوقت',hint:'فكّر في توزيع وقت الدراسة والراحة.',hintEn:'Think about balancing time for study and rest.'},
 {...questions[1],text:'أي عبارة توضّح أهمية التعاون بين الطلاب؟',textEn:'Which phrase explains the value of cooperation?',options:['نتعلّم معًا','نعمل بمفردنا'],optionsEn:['We learn together','We work alone'],correctAnswer:'نتعلّم معًا'},
 {...questions[0],id:'q3',type:'TRUE_FALSE',text:'قراءة التعليمات تساعد على فهم المطلوب.',textEn:'Reading instructions helps you understand the task.',correctAnswer:'True'},
 {...questions[1],id:'q4',text:'ما عنوان مناسب لهذا النص؟',textEn:'What is a suitable title for the text?',options:['خطوة نحو النجاح','رحلة إلى البحر'],optionsEn:['A step toward success','A trip to the sea'],correctAnswer:'خطوة نحو النجاح'},
]};

for(const language of ['ar','en'])test(`active assessment has modern responsive navigation and accessible answers ${language}`,async({page})=>{
 test.setTimeout(180000);await studentSession(page,language);await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('**/api/exams/exam',r=>r.fulfill({json:assessment}));await page.emulateMedia({reducedMotion:'reduce'});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,390,768,1011,1264,1536]){
  await page.setViewportSize({width,height:width<600?844:960});await page.goto('/exams/exam',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:language==='ar'?'ابدأ الامتحان الآن':'Start Exam Now',exact:true}).click();await expect(page.locator('[data-exam-workspace]')).toBeVisible();
  const answer=page.getByRole('button').filter({hasText:language==='ar'?'تنظيم الوقت':'Time management'}).first();await answer.click();await expect(answer).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.getByRole('heading',{level:1})).toContainText(language==='ar'?'اللغة العربية':'Arabic');await expect(page.getByRole('progressbar')).toHaveAttribute('value','25');
  await expect(page.locator('[data-exam-question]')).toBeVisible();
  if(width===390||width===1264){const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);await page.screenshot({path:`../artifacts/active-exam-ui/active-${language}-${width}.png`,fullPage:true});}
  if(width<=850)await page.getByRole('button',{name:language==='ar'?'عرض الأسئلة':'Show questions',exact:true}).click();
  const navigation=page.getByRole('navigation',{name:language==='ar'?'أسئلة الاختبار':'Exam questions',exact:true});await expect(navigation.getByRole('button')).toHaveCount(4);await expect(navigation.getByRole('button').first()).toHaveAttribute('data-answered','true');await navigation.getByRole('button').nth(2).click();await expect(page.getByRole('button',{name:language==='ar'?'صحيح':'True',exact:true})).toBeVisible();
 }
 expect(errors).toEqual([]);
});

test('answer, hint, flags, language and question filters survive navigation and reload',async({page})=>{
 await studentSession(page);await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('**/api/exams/exam',r=>r.fulfill({json:assessment}));await page.setViewportSize({width:390,height:844});await page.goto('/exams/exam',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Start Exam Now',exact:true}).click();
 await page.getByRole('button').filter({hasText:'Time management'}).first().click();await page.getByRole('button',{name:'Mark for Review',exact:true}).click();await page.getByRole('button',{name:'Show Hint',exact:true}).click();await expect(page.getByText('Think about balancing time for study and rest.',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Show questions',exact:true}).click();const navigation=page.getByRole('navigation',{name:'Exam questions',exact:true});await expect(navigation.getByRole('button').first()).toHaveAttribute('data-flagged','true');await page.getByLabel('Question navigation').selectOption('flagged');await expect(navigation.getByRole('button')).toHaveCount(1);await page.getByLabel('Question navigation').selectOption('unanswered');await expect(navigation.getByRole('button')).toHaveCount(3);await page.getByLabel('Question navigation').selectOption('all');
 await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('button',{name:'Previous',exact:true}).click();await expect(page.getByRole('button').filter({hasText:'Time management'}).first()).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:'العربية',exact:true}).click();await expect(page.getByRole('button').filter({hasText:'تنظيم الوقت'}).first()).toHaveAttribute('aria-pressed','true');
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('exam_exam_root_answers')||'[]')[0]?.selectedAnswer)).toBe('Time management');await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Start Exam Now',exact:true}).click();await expect(page.getByRole('button').filter({hasText:'Time management'}).first()).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('button',{name:'Mark for Review',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Open calculator',exact:true}).click();await expect(page.getByText('Scientific Calculator',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Close calculator',exact:true}).click();await expect(page.getByText('Scientific Calculator',{exact:true})).toHaveCount(0);
});
