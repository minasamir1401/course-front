/** Shared catalog: selecting a subject gives every student view the same artwork. */
type Family = 'mathematics'|'arabic'|'english'|'science'|'social-studies'|'computing'|'art'|'sports'|'languages';
type Subject = { key:string; ar:string; en:string; family:Family; aliases:string[] };
export const SUBJECT_CATALOG:Subject[] = [
  {key:'arabic',ar:'اللغة العربية',en:'Arabic',family:'arabic',aliases:['عربي','عربى','لغة عربية','Arabic language']},
  {key:'english',ar:'اللغة الإنجليزية',en:'English',family:'english',aliases:['انجليزي','انجليزى','لغة انجليزية','English language','SAT English']},
  {key:'french',ar:'اللغة الفرنسية',en:'French',family:'languages',aliases:['فرنسي','فرنساوي','French language']},
  {key:'german',ar:'اللغة الألمانية',en:'German',family:'languages',aliases:['الماني','German language']},
  {key:'italian',ar:'اللغة الإيطالية',en:'Italian',family:'languages',aliases:['ايطالي','Italian language']},
  {key:'mathematics',ar:'الرياضيات',en:'Mathematics',family:'mathematics',aliases:['رياضيات','Math','Maths','SAT Math','حساب','الحساب']},
  {key:'science',ar:'العلوم',en:'Science',family:'science',aliases:['علوم','العلوم المتكاملة','Integrated science']},
  {key:'physics',ar:'الفيزياء',en:'Physics',family:'science',aliases:['فيزياء']},
  {key:'chemistry',ar:'الكيمياء',en:'Chemistry',family:'science',aliases:['كيمياء']},
  {key:'biology',ar:'الأحياء',en:'Biology',family:'science',aliases:['احياء']},
  {key:'geology',ar:'الجيولوجيا',en:'Geology',family:'science',aliases:['جيولوجيا']},
  {key:'mechanics',ar:'الميكانيكا',en:'Mechanics',family:'mathematics',aliases:['ميكانيكا']},
  {key:'social-studies',ar:'الدراسات الاجتماعية',en:'Social studies',family:'social-studies',aliases:['دراسات','دراسات اجتماعية','الدراسات']},
  {key:'history',ar:'التاريخ',en:'History',family:'social-studies',aliases:['تاريخ']},
  {key:'geography',ar:'الجغرافيا',en:'Geography',family:'social-studies',aliases:['جغرافيا']},
  {key:'philosophy',ar:'الفلسفة',en:'Philosophy',family:'social-studies',aliases:['فلسفة']},
  {key:'psychology',ar:'علم النفس',en:'Psychology',family:'social-studies',aliases:[]},
  {key:'economics',ar:'الاقتصاد',en:'Economics',family:'social-studies',aliases:['اقتصاد']},
  {key:'statistics',ar:'الإحصاء',en:'Statistics',family:'mathematics',aliases:['احصاء']},
  {key:'religion',ar:'التربية الدينية',en:'Religious education',family:'arabic',aliases:['الدين','دين','Religion']},
  {key:'civics',ar:'التربية الوطنية',en:'Civic education',family:'social-studies',aliases:['وطنية','Civics','National education']},
  {key:'computing',ar:'الحاسب الآلي',en:'Computing',family:'computing',aliases:['تقنية المعلومات','تكنولوجيا المعلومات','الحاسب','حاسب الي','كمبيوتر','ICT','IT','Computer science','Information technology','Computer']},
  {key:'art',ar:'التربية الفنية',en:'Art',family:'art',aliases:['فنون','الفنون','رسم','فنية','Arts','Art education']},
  {key:'sports',ar:'التربية الرياضية',en:'Physical education',family:'sports',aliases:['رياضة','الرياضة','رياضية','Sports','PE']},
  {key:'languages',ar:'اللغات',en:'Languages',family:'languages',aliases:['لغة','Language']},
];

export function normalizeSubject(value:string):string {
  return value.toLowerCase().normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}
export function parseSubjects(value:unknown):string[] {
  if(Array.isArray(value)) return value.flatMap(parseSubjects);
  if(typeof value!=='string'||!value.trim()) return [];
  const text=value.trim();
  if(text.startsWith('[')||text.startsWith('"')) {
    try { const parsed:unknown=JSON.parse(text); if(parsed!==text) return parseSubjects(parsed); } catch { /* Existing plain subject values are also supported. */ }
  }
  return text.split(/[,،;|]/).map(part=>part.trim()).filter(Boolean);
}
const aliases=SUBJECT_CATALOG.flatMap(subject=>[subject.ar,subject.en,...subject.aliases].map(alias=>({subject,alias:normalizeSubject(alias)}))).sort((a,b)=>b.alias.length-a.alias.length);
function matchSubject(value:string,withinTitle=false) {
  const normalized=normalizeSubject(value);
  return aliases.find(({alias})=>withinTitle?(' '+normalized+' ').includes(' '+alias+' '):normalized===alias)?.subject;
}
export function getSubjectArtwork(subject:unknown,title='') {
  const values=parseSubjects(subject);
  // An explicit subject wins over any subject words in a course/exam title.
  const selected=values.map(value=>matchSubject(value)).find(Boolean)||(!values.length?matchSubject(title,true):undefined);
  return selected?{...selected,src:`/klevro/subjects/${selected.family}.webp`}:{key:'general',ar:'مقرر دراسي',en:'Course',family:'general',src:'/klevro/illustrations/dashboard-education.png'};
}
