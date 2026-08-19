const fs = require('fs');

const applyMetadataToContent = (content) => {
  // 1. Update setCurrentQuestion initial state
  content = content.replace(/correctAnswers:\s*\[\],/g, `correctAnswers: [], course: "", section: "", domain: "", subskill: "", microSkill: "", gradeTarget: "", errorPattern: "", estimatedTime: "",`);

  // 2. Add state for showAdvancedMetadata
  if (!content.includes('const [showAdvancedMetadata, setShowAdvancedMetadata]')) {
    content = content.replace(/const\s+\[showQuestionForm,\s*setShowQuestionForm\]\s*=\s*useState\(false\);/, 
      `const [showQuestionForm, setShowQuestionForm] = useState(false);\n  const [showAdvancedMetadata, setShowAdvancedMetadata] = useState(false);`
    );
  }

  // 3. Inject Advanced Metadata UI before Save/Cancel buttons
  const saveCancelRegex = /\{\/\*\s*Cancel \/ Save\s*\*\/\}\s*<div className="flex justify-end gap-4 pt-4 border-t border-slate-100">/;
  if (content.match(saveCancelRegex) && !content.includes('Advanced Metadata Section')) {
    const uiSnippet = `
                  {/* Advanced Metadata Section */}
                  <div className="border-t border-slate-100 pt-6 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedMetadata(!showAdvancedMetadata)}
                      className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors mb-4"
                    >
                      <ChevronDown className={\`w-4 h-4 transition-transform \${showAdvancedMetadata ? 'rotate-180' : ''}\`} />
                      {language === 'ar' ? 'البيانات الوصفية المتقدمة (اختياري)' : 'Advanced Metadata (Optional)'}
                    </button>
                    
                    {showAdvancedMetadata && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
                        {/* 1. Course */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'الكورس (Course)' : 'Course'}</label>
                          <input type="text" value={currentQuestion.course || ''} onChange={(e) => updateCurrentQuestion("course", e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all" placeholder="Enter course..." />
                        </div>
                        {/* 2. Section */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'القسم (Section)' : 'Section'}</label>
                          <input type="text" value={currentQuestion.section || ''} onChange={(e) => updateCurrentQuestion("section", e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all" placeholder="Enter section..." />
                        </div>
                        {/* 3. Domain */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المجال (Domain)' : 'Domain'}</label>
                          <input type="text" value={currentQuestion.domain || ''} onChange={(e) => updateCurrentQuestion("domain", e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all" placeholder="Enter domain..." />
                        </div>
                        {/* 4. Subskill */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المهارة الفرعية (Subskill)' : 'Subskill'}</label>
                          <input type="text" value={currentQuestion.subskill || ''} onChange={(e) => updateCurrentQuestion("subskill", e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all" placeholder="Enter subskill..." />
                        </div>
                        {/* 5. Micro Skill */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المهارة الدقيقة (Micro Skill)' : 'Micro Skill'}</label>
                          <input type="text" value={currentQuestion.microSkill || ''} onChange={(e) => updateCurrentQuestion("microSkill", e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all" placeholder="Enter micro skill..." />
                        </div>
                        {/* 6. Grade Target */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'الصف المستهدف (Grade Target)' : 'Grade Target'}</label>
                          <input type="text" value={currentQuestion.gradeTarget || ''} onChange={(e) => updateCurrentQuestion("gradeTarget", e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all" placeholder="Enter grade target..." />
                        </div>
                        {/* 7. Error Pattern */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'نمط الخطأ (Error Pattern)' : 'Error Pattern'}</label>
                          <input type="text" value={currentQuestion.errorPattern || ''} onChange={(e) => updateCurrentQuestion("errorPattern", e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all" placeholder="Enter error pattern..." />
                        </div>
                        {/* 8. Estimated Time */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'الوقت المقدر (Estimated Time)' : 'Estimated Time'}</label>
                          <input type="text" value={currentQuestion.estimatedTime || ''} onChange={(e) => updateCurrentQuestion("estimatedTime", e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all" placeholder="e.g. 5 mins" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cancel / Save */}
                  <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
    `;
    content = content.replace(saveCancelRegex, uiSnippet);
  }

  return content;
};

const files = [
  'src/app/super-admin/exams/new/page.tsx',
  'src/app/school-admin/exams/new/page.tsx',
  'src/app/super-admin/exams/edit/[id]/page.tsx',
  'src/app/school-admin/exams/edit/[id]/page.tsx'
];

for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    content = applyMetadataToContent(content);
    fs.writeFileSync(file, content);
    console.log("Updated", file);
  } catch (error) {
    console.error("Error updating", file, error.message);
  }
}
console.log("Advanced Metadata feature added!");
