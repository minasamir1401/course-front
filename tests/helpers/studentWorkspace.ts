import { Page } from '@playwright/test';
import { serverSession } from './serverSession';
export const stamp = '2026-10-17T10:00:00Z';
export const questions = [
 {id:'q1',text:'First question',textEn:'First question',type:'MCQ',options:['Choice A','Choice B'],optionsEn:['Choice A','Choice B'],correctAnswer:'Choice A',points:5,order:0},
 {id:'q2',text:'Second question',textEn:'Second question',type:'MCQ',options:['Choice C','Choice D'],optionsEn:['Choice C','Choice D'],correctAnswer:'Choice C',points:5,order:1}
];
export const lesson = {id:'lesson',title:'Study lesson',courseId:'course',order:0,isVisible:true,slides:[{id:'slide',type:'TEXT',title:'Lesson introduction',content:'<p>Read this lesson.</p>'}],questions,assignments:[],attachments:[],progresses:[]};
export const course = {id:'course',title:'Mathematics',subject:'Math',description:'Learn step by step.',lessons:[lesson,{...lesson,id:'future-lesson',title:'Scheduled lesson',publishDate:'2099-01-01T00:00:00Z'}],progressPercent:40,completedLessonsCount:0,totalLessons:2,totalDurationSeconds:1200};
export const exam = {id:'exam',title:'School exam',titleEn:'School exam',type:'Exam',duration:30,attemptsAllowed:3,passingScore:80,status:'PUBLISHED',modules:[],questions,submissions:[],resultVisibility:'SHOW_ALL'};
export const result = {id:'submission',createdAt:stamp,totalScore:5,percentage:50,historicalSnapshot:true,passed:false,correctAnswers:1,totalQuestions:2,earnedXP:10,
 exam:{...exam,totalPoints:10},answers:[{id:'a1',selectedAnswer:'Choice A',isCorrect:true,question:questions[0]},{id:'a2',selectedAnswer:'Choice D',isCorrect:false,question:questions[1]}]};
export const report = {generatedAt:stamp,timeZone:'Africa/Cairo',summary:{totalAttempts:2,selectedAttempts:1,uniqueStudents:1,averageScore:50,passRate:0,legacyAttempts:0,eligibleCount:null},
 students:[{id:'submission',name:'Student',examTitle:'School exam',percentage:50,passingScore:80,passed:false,createdAt:stamp}],timeline:[],skills:[],questions:[],schools:[],modules:[],subExams:[],pagination:{page:1,limit:25,total:1,pages:1}};
export async function studentSession(page:Page,language='en'){
 await serverSession(page);
 await page.addInitScript(language=>{localStorage.setItem('lms_token','cookie_auth');localStorage.setItem('lms_token_expires_at',String(Date.now()+86400000));localStorage.setItem('lms_user',JSON.stringify({id:'me',role:'STUDENT',name:'Student',grade:'Grade 3',schoolId:'school'}));localStorage.setItem('lms_lang',language);},language);
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname;let data:any={};
  if(path==='/api/auth/me')data={authenticated:true,user:{id:'me',role:'STUDENT',name:'Student',grade:'Grade 3',schoolId:'school'}};
  else if(path==='/api/student/stats')data={name:'Student',schoolName:'School',grade:'Grade 3',classroomName:'A',teacherName:'Teacher',overallCourseProgress:40,avgScore:50,totalExams:2,xp:20,courseProgresses:[course],upcomingTasks:[],generatedAt:stamp};
  else if(path==='/api/student/xp-summary')data={totalXP:20,courseXP:[{courseId:'course',xp:10}],skillsXP:{title:'Activities',xp:10}};
  else if(path==='/api/certificates')data={items:[],total:0};
  else if(path==='/api/courses/course')data=course;
  else if(path==='/api/lessons/lesson')data=lesson;
  else if(path==='/api/exams')data=[exam];
  else if(path==='/api/exams/exam')data=exam;
  else if(path.endsWith('/check'))data={canTakeAgain:true,attemptsUsed:0,attemptsAllowed:3};
  else if(path.endsWith('/verify-access'))data={allowed:true};
  else if(path.endsWith('/submit'))data={submissionId:'submission'};
  else if(path==='/api/exams/submissions/submission')data=result;
  else if(path==='/api/reports/options')data={schools:[{id:'school',name:'School'}],grades:[],classrooms:[],subjects:['Math'],courses:[{id:'course',title:'Mathematics'}],exams:[{...exam,schoolId:'school'}]};
  else if(path==='/api/reports/overview')data=report;
  else if(path==='/api/workspace/assignments')data={tasks:[{id:'task',title:'Practice today',status:'AVAILABLE',kind:'LESSON',dueAt:'2099-01-01T00:00:00Z',href:'/lessons/lesson?courseId=course'},{id:'task-closed',title:'Closed task',status:'CLOSED',kind:'EXAM',dueAt:'2020-01-01T00:00:00Z',href:'/exams/exam/details'}]};
  else if(path==='/api/workspace/calendar'){const url=new URL(route.request().url());const day=url.searchParams.get('from');data={events:[{id:'event',title:'Upcoming lesson',kind:'LESSON_START',day,at:day+'T12:00:00Z',href:'/lessons/lesson?courseId=course'}]};}
  else if(path==='/api/skills-hub/progress')data={grade:'Grade 3',subjects:['Math','Science','Language','Arts'],clusters:[],totalStarsEarned:0,maxPossibleStars:0,masteryPercent:0,totalActivities:0,completedActivities:0};
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
}
