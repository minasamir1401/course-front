import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { studentSession } from './helpers/studentWorkspace';

const title = JSON.stringify({ar:'اجمع العددين واختر الإجابة الصحيحة',en:'Add the numbers and choose the correct answer'});
const fresh={id:'fresh',title,type:'MCQ',difficulty:'Easy',options:['4','5'],hint:JSON.stringify({ar:'فكّر في جمع اثنين واثنين.',en:'Think about adding two and two.'}),tip:JSON.stringify({ar:'عدّ ببطء.',en:'Count slowly.'}),xpPoints:7,estimatedTime:300,bestAttemptStars:0,hasAttempt:false};
const saved={...fresh,id:'saved',title:JSON.stringify({ar:'راجع ما تعلمته عن الأعداد',en:'Review your number skills'}),hasAttempt:true,bestAttemptStars:3,bestAttemptCorrect:true};
const wrong={...fresh,id:'wrong',title:JSON.stringify({ar:'نشاط تمت الإجابة عليه',en:'An activity you already answered'}),type:'TRUE_FALSE',hasAttempt:true,bestAttemptStars:0,bestAttemptCorrect:false};
const matching={...fresh,id:'matching',title:JSON.stringify({ar:'وصّل كل عدد بالمجموعة المناسبة',en:'Match each number to the right group'}),type:'MATCHING',difficulty:'Medium'};
const clusters=[{id:'math',name:JSON.stringify({ar:'مهارات الرياضيات والتفكير المنطقي',en:'Mathematics & logical thinking'}),subject:'Math',description:JSON.stringify({ar:'تدرّب على الأعداد والعمليات بخطوات بسيطة.',en:'Practise numbers and operations one step at a time.'}),stats:{totalActivities:4,totalStarsEarned:3,maxPossibleStars:12,totalXPEarned:7,masteryPercent:25},skills:[{id:'numbers',name:JSON.stringify({ar:'الأعداد والعمليات الحسابية',en:'Numbers & operations'}),activities:[fresh,saved,wrong,matching]}]},{id:'arabic',name:JSON.stringify({ar:'التواصل والقراءة',en:'Reading & communication'}),subject:'Arabic',stats:{totalActivities:1,totalStarsEarned:0,maxPossibleStars:3,totalXPEarned:0,masteryPercent:0},skills:[{id:'reading',name:'Reading',activities:[{...fresh,id:'reading-activity',title:'Reading comprehension'}]}]}];

async function setup(page:any,language='en') {
  await studentSession(page,language);await page.route('https://fonts.googleapis.com/**',(r:any)=>r.abort());await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('**/api/skills-hub/progress*',(r:any)=>{const subject=new URL(r.request().url()).searchParams.get('subject');return r.fulfill({json:{grade:'الصف الثالث الابتدائي',subjects:['Math','Arabic'],clusters:subject?clusters.filter(c=>c.subject===subject):clusters}});});
  await page.route('**/api/skills-hub/activities/*',(r:any)=>r.fulfill({json:fresh}));
}

for(const language of ['ar','en']) test('modern activity overview and player are responsive and accessible '+language,async({page})=>{
  test.setTimeout(150000);await setup(page,language);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  for(const width of [320,390,768,1264,1536]) {
    await page.setViewportSize({width,height:900});await page.goto('/activities',{waitUntil:'domcontentloaded'});await expect(page.locator('[data-activity-card="fresh"]')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(await page.locator('[data-learning-backdrop]').evaluate(el=>{const bounds=el.getBoundingClientRect();return bounds.left<=1&&bounds.right>=innerWidth-1;})).toBe(true);
    if(width===390||width===1264) {
      await expect.poll(()=>page.locator('main header img').first().evaluate((img:HTMLImageElement)=>img.complete && img.naturalWidth>0),{timeout:15000}).toBe(true);const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);await page.screenshot({path:`../artifacts/activities-ui/activities-${language}-${width}.png`,fullPage:true});
    }
    await page.locator('[data-activity-card="fresh"] button').click();const player=page.locator('[data-activity-player]');await expect(player).toBeVisible();
    expect(await player.evaluate(el=>{const rect=el.getBoundingClientRect();return Math.abs(rect.top)<1&&Math.abs(rect.left)<1&&Math.abs(rect.width-innerWidth)<1&&Math.abs(rect.height-innerHeight)<1&&el.scrollWidth<=el.clientWidth;})).toBe(true);
    const confirm=player.getByRole('button',{name:language==='ar'?'تأكيد الإجابة':'Confirm Answer',exact:true});await expect(confirm).toBeDisabled();await player.getByRole('button',{name:/4/}).first().click();await expect(confirm).toBeEnabled();
    if(width===390||width===1264) {
      const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);await page.screenshot({path:`../artifacts/activities-ui/player-${language}-${width}.png`,fullPage:false});
    }
    await player.getByRole('button',{name:language==='ar'?'إغلاق':'Close',exact:true}).click();await expect(player).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test('activity search, saved-state filter, subjects, collapse and inline hints work',async({page})=>{
  await setup(page);await page.goto('/activities',{waitUntil:'domcontentloaded'});await expect(page.locator('[data-activity-card="fresh"]')).toBeVisible();
  await page.getByLabel('Activity status',{exact:true}).selectOption('saved');await expect(page.locator('[data-activity-card]')).toHaveCount(2);await expect(page.locator('[data-activity-card="wrong"]')).toBeVisible();
  await page.getByLabel('Activity status',{exact:true}).selectOption('new');await expect(page.locator('[data-activity-card]')).toHaveCount(3);
  await page.getByLabel('Search activities or skills',{exact:true}).fill('not a real activity');await expect(page.getByRole('heading',{name:'No matching activities'})).toBeVisible();await page.getByRole('button',{name:'Clear filters',exact:true}).click();
  await page.getByRole('group',{name:'Subject',exact:true}).getByRole('button',{name:'Arabic',exact:true}).click();await expect(page.locator('[data-activity-card="fresh"]')).toHaveCount(0);await expect(page.locator('[data-subject="arabic"]').first()).toBeVisible();await page.getByRole('group',{name:'Subject',exact:true}).getByRole('button',{name:'All subjects',exact:true}).click();
  const cluster=page.getByRole('button',{name:/Mathematics & logical thinking/});await expect(cluster).toHaveAttribute('aria-expanded','true');await cluster.click();await expect(page.locator('[data-activity-card="fresh"]')).toBeHidden();await cluster.click();
  const opener=page.locator('[data-activity-card="fresh"] button');await opener.click();const player=page.locator('[data-activity-player]');await player.getByRole('button',{name:'Hint',exact:true}).click();await expect(player.getByText('Think about adding two and two.',{exact:true})).toBeVisible();await player.getByRole('button',{name:/4/}).first().click();await expect(player.getByText('Think about adding two and two.',{exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(player.getByText('Think about adding two and two.',{exact:true})).toHaveCount(0);await expect(player).toBeVisible();await page.keyboard.press('Escape');await expect(player).toHaveCount(0);await expect(opener).toBeFocused();
});

test('activity overview distinguishes loading failure from an empty published subject',async({page})=>{
  await setup(page);let fail=true;await page.route('**/api/skills-hub/progress*',r=>fail?r.fulfill({status:503,json:{error:'Unavailable'}}):r.fulfill({json:{grade:'Grade 3',subjects:[],clusters:[]}}));await page.goto('/activities',{waitUntil:'domcontentloaded'});await expect(page.getByRole('alert').filter({hasText:'Could not load activities'})).toBeVisible();await expect(page.getByRole('heading',{name:'Your next activities start here'})).toHaveCount(0);fail=false;await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByRole('heading',{name:'Your next activities start here'})).toBeVisible();
});
