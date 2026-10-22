import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { studentSession, report } from './helpers/studentWorkspace';

const routes=[
  ['/dashboard','Welcome','أهلًا'],['/courses','My courses','مقرراتي الدراسية'],['/exams','Exams & assessments','الامتحانات والتقييمات'],['/activities','Activities & skills','الأنشطة والمهارات'],['/calendar','Your academic calendar','تقويمك الدراسي'],['/reports','Your progress & next step','تقدّمك وخطوتك التالية']
];
async function readable(page:Page) {
  const problems=await page.locator('main').first().evaluate(root=>Array.from(root.querySelectorAll<HTMLElement>('*')).filter(el=>{
    if(!el.getClientRects().length||el.closest('svg,[aria-hidden="true"],:disabled'))return false;
    return Array.from(el.childNodes).some(node=>node.nodeType===Node.TEXT_NODE&&node.textContent?.trim());
  }).flatMap(el=>{const style=getComputedStyle(el);return Number.parseFloat(style.fontSize)<12?[{text:el.textContent?.slice(0,65),font:style.fontSize}]:[];}));
  expect(problems).toEqual([]);
  for(const icon of await page.locator('[data-reference-icon]').all()) {
    if(await icon.isVisible())expect(await icon.evaluate(el=>Number(getComputedStyle(el).opacity))).toBe(1);
  }
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(audit.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}

for(const language of ['ar','en'])for(const width of [390,1264])test(`student pages have readable text, full icons and correct direction ${language} ${width}`,async({page})=>{
  test.setTimeout(180000);await studentSession(page,language);await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width,height:950});
  await page.route('**/api/reports/overview*',r=>r.fulfill({json:{...report,timeline:[{day:'2026-10-17',attempts:2,averageScore:50},{day:'2026-10-18',attempts:1,averageScore:70}]}}));
  for(const [path,en,ar] of routes) {
    await page.goto(path,{waitUntil:'domcontentloaded'});await expect(page.getByRole('heading',{level:1})).toContainText(language==='ar'?ar:en);
    if(path==='/reports')await expect(page.getByText(language==='ar'?'متوسط الدرجة':'Average score',{exact:true})).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang',language);await expect(page.locator('html')).toHaveAttribute('dir',language==='ar'?'rtl':'ltr');
    await readable(page);await page.screenshot({path:`../artifacts/student-language/${path.slice(1)}-${language}-${width}.png`,fullPage:true});
  }
});

test('student language switch updates every page and subject labels immediately',async({page})=>{
  test.setTimeout(100000);await studentSession(page,'ar');await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.setViewportSize({width:1264,height:950});
  await page.route('**/api/skills-hub/progress*',r=>r.fulfill({json:{grade:'الصف الأول الثانوي',subjects:['Math','Arabic'],clusters:[]}}));
  for(const [path,en,ar] of routes) {
    await page.goto(path,{waitUntil:'domcontentloaded'});await expect(page.getByRole('heading',{level:1})).toContainText(ar);await page.getByRole('button',{name:'التبديل للإنجليزية',exact:true}).click();await expect(page.getByRole('heading',{level:1})).toContainText(en);await expect(page.locator('html')).toHaveAttribute('dir','ltr');
    expect(await page.evaluate(()=>localStorage.getItem('lms_lang'))).toBe('en');await page.getByRole('button',{name:'Switch to Arabic',exact:true}).click();await expect(page.getByRole('heading',{level:1})).toContainText(ar);await expect(page.locator('html')).toHaveAttribute('dir','rtl');
    if(path==='/activities') {const subjects=page.getByRole('group',{name:'المادة الدراسية',exact:true});await expect(subjects.getByRole('button',{name:'الرياضيات',exact:true})).toBeVisible();await expect(subjects.getByRole('button',{name:'اللغة العربية',exact:true})).toBeVisible();}
  }
});

for(const language of ['ar','en'])test('login stays readable and mirrors the submit arrow '+language,async({page})=>{
  await page.addInitScript(language=>{localStorage.clear();localStorage.setItem('lms_lang',language);},language);await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.emulateMedia({reducedMotion:'reduce'});
  for(const width of [390,1264]){
    await page.setViewportSize({width,height:950});await page.goto('/login',{waitUntil:'domcontentloaded'});await expect(page.locator('#student-username')).toBeVisible();await readable(page);
    const arrowAtEnd=await page.locator('button[type="submit"]').evaluate((button,lang)=>{const bounds=button.getBoundingClientRect(),icon=button.querySelector('svg')!.getBoundingClientRect();return lang==='ar'?icon.x<bounds.x+bounds.width/2:icon.x>bounds.x+bounds.width/2;},language);expect(arrowAtEnd).toBe(true);
    await page.screenshot({path:`../artifacts/student-language/login-${language}-${width}.png`,fullPage:true});
  }
});

for(const language of ['ar','en'])test('student navigation and pages fit narrow, tablet and wide screens '+language,async({page})=>{
  test.setTimeout(160000);await studentSession(page,language);await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  for(const width of [320,768,1024,1536])for(const [path,en,ar] of routes){
    await page.setViewportSize({width,height:950});await page.goto(path,{waitUntil:'domcontentloaded'});await expect(page.getByRole('heading',{level:1})).toContainText(language==='ar'?ar:en);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(width>=1024){const positions=await page.locator('.student-header nav a').evaluateAll(links=>links.map(link=>link.getBoundingClientRect().x));expect(positions.length).toBe(6);expect(language==='ar'?positions[0]>positions[5]:positions[0]<positions[5]).toBe(true);}
  }
});

test('login errors translate on language change without losing the entered credentials',async({page})=>{
  await page.addInitScript(()=>{localStorage.clear();localStorage.setItem('lms_lang','ar');});await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('**/api/auth/login',r=>r.fulfill({status:401,json:{error:'Invalid credentials'}}));await page.goto('/login',{waitUntil:'domcontentloaded'});await page.locator('#student-username').fill('student-test');await page.locator('#student-password').fill('test-password');await page.getByRole('button',{name:'دخول',exact:true}).click();await expect(page.locator('#login-error')).toContainText('اسم المستخدم أو كلمة المرور غير صحيحة.');await page.getByRole('button',{name:'التبديل للإنجليزية',exact:true}).click();await expect(page.locator('#login-error')).toContainText('Incorrect username or password.');await expect(page.locator('#student-username')).toHaveValue('student-test');await expect(page.locator('#student-password')).toHaveValue('test-password');
});

test('activity list and player use the supplied English activity title',async({page})=>{
  await studentSession(page);await page.route('https://fonts.googleapis.com/**',r=>r.abort());const activity={id:'translated',title:'تدريب الأعداد',titleEn:'Number practice',type:'MCQ',options:['4','5'],hasAttempt:false,bestAttemptStars:0};await page.route('**/api/skills-hub/progress*',r=>r.fulfill({json:{grade:'الصف الأول الثانوي',subjects:['Math'],clusters:[{id:'math',name:'Mathematics',subject:'Math',stats:{},skills:[{id:'numbers',name:'Numbers',activities:[activity]}]}]}}));await page.route('**/api/skills-hub/activities/translated',r=>r.fulfill({json:activity}));await page.goto('/activities',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Open activity: Number practice',exact:true}).click();await expect(page.locator('[data-activity-player]').getByRole('heading',{name:'Number practice',exact:true})).toBeVisible();
});

for(const language of ['ar','en'])test('all student report tabs remain readable '+language,async({page})=>{
  test.setTimeout(90000);await studentSession(page,language);await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.emulateMedia({reducedMotion:'reduce'});
  for(const width of [390,1264]){
    await page.setViewportSize({width,height:950});await page.goto('/reports',{waitUntil:'domcontentloaded'});await expect(page.getByText(language==='ar'?'متوسط الدرجة':'Average score',{exact:true})).toBeVisible();
    for(const label of language==='ar'?['النتائج والمحاولات','المهارات والأسئلة','الدروس وXP']:['Results & attempts','Skills & questions','Lessons & XP']){await page.getByRole('button',{name:label,exact:true}).click();await readable(page);}
  }
});
