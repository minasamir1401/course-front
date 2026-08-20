const fs = require('fs');
const path = require('path');

const directories = [
  'src/app/super-admin/exams/new',
  'src/app/super-admin/exams/edit/[id]',
  'src/app/school-admin/exams/new',
  'src/app/school-admin/exams/edit/[id]'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) return;

  const uiPath = path.join(dir, 'components', 'ModuleModal.tsx');
  if (fs.existsSync(uiPath)) {
    let content = fs.readFileSync(uiPath, 'utf8');

    // 1. Rename Tabs
    content = content.replace(
      `{ id: 'exercises', label: language === 'ar' ? "الأسئلة والامتحانات" : "Questions & Exams", icon: HelpCircle },`,
      `{ id: 'exercises', label: language === 'ar' ? "الاختبارات" : "Exams", icon: HelpCircle },`
    );

    // 2. Replace activeTab === 'exercises' block
    const oldExercisesBlockRegex = /\{\s*activeTab === 'exercises'\s*&&\s*renderQuestionsBuilder\('questions'\)\s*\}/;
    
    const newExercisesBlock = `{activeTab === 'exercises' && (
                  activeSubExamIndex !== null ? (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <h4 className="font-black text-indigo-900 text-lg">
                          {currentModule.subExams[activeSubExamIndex]?.title || (language === 'ar' ? 'اختبار بدون عنوان' : 'Untitled Exam')}
                        </h4>
                        <button 
                          onClick={() => setActiveSubExamIndex(null)}
                          className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all"
                        >
                          {language === 'ar' ? 'العودة لقائمة الاختبارات' : 'Back to Exams'}
                        </button>
                      </div>
                      {renderQuestionsBuilder('questions')}
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in fade-in p-2 sm:p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-xl font-black text-slate-900">{language === 'ar' ? "الاختبارات (Exams)" : "Exams"}</h4>
                        <button 
                          onClick={() => {
                            const newSubExams = [...(currentModule.subExams || [])];
                            newSubExams.push({ id: String(Date.now()), title: language === 'ar' ? "اختبار جديد" : "New Exam", questions: [] });
                            setCurrentModule({...currentModule, subExams: newSubExams});
                            setActiveSubExamIndex(newSubExams.length - 1);
                          }}
                          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all"
                        >
                          <Plus className="w-5 h-5" />
                          {language === 'ar' ? "إضافة اختبار جديد" : "Add New Exam"}
                        </button>
                      </div>
                      
                      {(currentModule.subExams?.length || 0) === 0 ? (
                        <div className="text-center p-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                          <p className="text-slate-500 font-bold mb-4">{language === 'ar' ? "لا يوجد اختبارات في هذا الموديول بعد" : "No exams in this module yet"}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentModule.subExams.map((subExam: any, idx: number) => (
                            <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:border-indigo-400 transition-all flex justify-between items-center group cursor-pointer" onClick={() => setActiveSubExamIndex(idx)}>
                              <div>
                                <h5 className="font-black text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">
                                  {subExam.title || (language === 'ar' ? 'اختبار بدون عنوان' : 'Untitled Exam')}
                                </h5>
                                <p className="text-slate-400 text-xs font-bold mt-1">
                                  {subExam.questions?.length || 0} {language === 'ar' ? 'أسئلة' : 'Questions'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newTitle = prompt(language === 'ar' ? "أدخل عنوان الاختبار:" : "Enter Exam Title:", subExam.title);
                                    if (newTitle !== null) {
                                      const newSubExams = [...currentModule.subExams];
                                      newSubExams[idx].title = newTitle;
                                      setCurrentModule({...currentModule, subExams: newSubExams});
                                    }
                                  }}
                                  className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا الاختبار؟" : "Are you sure you want to delete this exam?")) {
                                      const newSubExams = [...currentModule.subExams];
                                      newSubExams.splice(idx, 1);
                                      setCurrentModule({...currentModule, subExams: newSubExams});
                                    }
                                  }}
                                  className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                )}`;

    if (oldExercisesBlockRegex.test(content)) {
        content = content.replace(oldExercisesBlockRegex, newExercisesBlock);
        
        // Also make sure activeSubExamIndex and setActiveSubExamIndex are extracted from props
        const propsRegex = /const \{ showToast \} = useNotification\(\);\n\s*const \{([^}]+)\} = props;/;
        const match = content.match(propsRegex);
        if (match) {
            let propsList = match[1];
            if (!propsList.includes('activeSubExamIndex')) {
                const newPropsList = propsList + ', activeSubExamIndex, setActiveSubExamIndex';
                content = content.replace(propsList, newPropsList);
            }
        }
        
        fs.writeFileSync(uiPath, content);
        console.log(`Updated ${uiPath}`);
    } else {
        console.log(`Regex not matched in ${uiPath}`);
    }
  }
});
