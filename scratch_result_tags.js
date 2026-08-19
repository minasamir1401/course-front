const fs = require('fs');

const file = 'd:/mina/front/src/app/exams/result/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const questionTags = `
              {question.cognitive && <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm border border-slate-200">{language === 'ar' ? 'المعرفي: ' : 'Cognitive: '} {question.cognitive}</span>}
              {question.dok && <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm border border-slate-200">DOK: {question.dok}</span>}
              {question.difficulty && <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm border border-slate-200">{language === 'ar' ? 'الصعوبة: ' : 'Difficulty: '} {question.difficulty}</span>}
              {question.estimatedTime && <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm border border-slate-200 flex items-center gap-1"><Clock className="w-3 h-3"/> {question.estimatedTime}</span>}
              {question.indicators && <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm border border-slate-200">{language === 'ar' ? 'المؤشر: ' : 'Indicator: '} {question.indicators}</span>}
              {question.learningOutcomes && <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm border border-slate-200">{language === 'ar' ? 'ناتج التعلم: ' : 'Outcome: '} {question.learningOutcomes}</span>}
              {question.skill && <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm border border-slate-200">{language === 'ar' ? 'المهارة: ' : 'Skill: '} {question.skill}</span>}
              {question.subskill && <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm border border-slate-200">{language === 'ar' ? 'المهارة الفرعية: ' : 'Subskill: '} {question.subskill}</span>}
              {question.microSkill && <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm border border-slate-200">{language === 'ar' ? 'المهارة الدقيقة: ' : 'Micro: '} {question.microSkill}</span>}
`;

if (content.includes("question.type === 'MCQ' ?")) {
    content = content.replace(
        /(<span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-\[10px\] font-black uppercase tracking-wider shadow-sm shadow-indigo-200">[\s\S]*?<\/span>)/g,
        '$1' + questionTags
    );
}

fs.writeFileSync(file, content, 'utf8');
console.log('Updated result page.');
