const fs = require('fs');

function injectUnifiedUI(filepath, isSchoolAdmin) {
    let content = fs.readFileSync(filepath, 'utf8');

    // 1. Delete InternalExamModulesManager import
    content = content.replace(/import InternalExamModulesManager from "@\/components\/exam-builder\/InternalExamModulesManager";\r?\n/, "");

    // 2. Add new states and API functions near the top of the component
    const stateHookStr = `  const [questions, setQuestions] = useState<any[]>([]);`;
    const newStates = `
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleFormData, setModuleFormData] = useState({
    title: '', description: '', order: 0, duration: '', passingScore: ''
  });
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const toggleModule = (id: string) => {
    setExpandedModules(prev => prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]);
  };

  const handleSaveModule = async () => {
    if (!moduleFormData.title) {
      showToast(language === 'ar' ? "يرجى إدخال عنوان الموديول" : "Please enter a module title", "error");
      return;
    }
    try {
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("lms_token") || localStorage.getItem("token");
      const url = editingModuleId ? \`\${API_URL}/exams/\${id}/modules/\${editingModuleId}\` : \`\${API_URL}/exams/\${id}/modules\`;
      const res = await fetch(url, {
        method: editingModuleId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
        body: JSON.stringify({ ...moduleFormData, duration: moduleFormData.duration ? parseInt(moduleFormData.duration) : null, passingScore: moduleFormData.passingScore ? parseInt(moduleFormData.passingScore) : null })
      });
      if (!res.ok) throw new Error("Failed to save module");
      const savedModule = await res.json();
      setExamInfo(prev => ({
        ...prev,
        modules: editingModuleId 
          ? prev.modules.map((m: any) => m.id === editingModuleId ? savedModule : m)
          : [...(prev.modules || []), savedModule]
      }));
      setIsAddingModule(false); setEditingModuleId(null);
      setModuleFormData({ title: '', description: '', order: 0, duration: '', passingScore: '' });
      showToast(language === 'ar' ? "تم الحفظ بنجاح" : "Saved successfully", "success");
    } catch (error) {
      console.error(error);
      showToast(language === 'ar' ? "حدث خطأ أثناء الحفظ" : "Error saving module", "error");
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا الموديول؟" : "Are you sure you want to delete this module?")) return;
    try {
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("lms_token") || localStorage.getItem("token");
      const res = await fetch(\`\${API_URL}/exams/\${id}/modules/\${moduleId}\`, {
        method: 'DELETE', headers: { Authorization: \`Bearer \${token}\` }
      });
      if (!res.ok) throw new Error("Failed to delete module");
      setExamInfo(prev => ({ ...prev, modules: prev.modules.filter((m: any) => m.id !== moduleId) }));
      showToast(language === 'ar' ? "تم الحذف بنجاح" : "Deleted successfully", "success");
    } catch (error) {
      console.error(error);
      showToast(language === 'ar' ? "حدث خطأ أثناء الحذف" : "Error deleting module", "error");
    }
  };
`;
    content = content.replace(stateHookStr, stateHookStr + newStates);

    // 3. Delete the InternalExamModulesManager usage
    const managerUsageRegex = /\{\/\* Modules Manager \*\/\}[\s\S]*?<InternalExamModulesManager[\s\S]*?\/>/;
    content = content.replace(managerUsageRegex, "");

    // 4. Replace the Grouped Questions List with the Unified UI
    const groupedStart = "{/* Grouped Questions List */}";
    const groupedEndRegex = /\}\)\(\)\}\r?\n\s*<\/div>/;
    
    let mapStartIdx = content.indexOf(groupedStart);
    if (mapStartIdx !== -1) {
        let match = content.match(groupedEndRegex);
        if (match) {
            let mapEndIdx = match.index + match[0].length;
            
            // We need to extract the renderQuestionCard mapping loop from the old content so we don't have to rewrite it
            let oldBlock = content.substring(mapStartIdx, mapEndIdx);
            
            // Find the moduleQuestions.map
            let moduleMapStart = oldBlock.indexOf("{moduleQuestions.length > 0 ? moduleQuestions.map(({ q, index }) => (");
            let moduleMapEnd = oldBlock.indexOf(")) : (", moduleMapStart);
            let questionCardContent = oldBlock.substring(moduleMapStart + "{moduleQuestions.length > 0 ? moduleQuestions.map(({ q, index }) => (".length, moduleMapEnd).trim();

            const newRendering = `{/* Unified Modules Interface */}
                  <div className="flex justify-between items-center mb-6 px-4">
                     <div>
                        <h2 className="text-xl font-black text-slate-800">{language === 'ar' ? "إدارة الموديولات (الأقسام)" : "Manage Modules (Sections)"}</h2>
                        <p className="text-slate-500 text-sm mt-1">{language === 'ar' ? "يمكنك تقسيم الامتحان إلى عدة موديولات، وتحديد وقت ودرجة نجاح لكل موديول." : "Divide the exam into multiple modules."}</p>
                     </div>
                     <button onClick={() => { setModuleFormData({title: '', description: '', order: examInfo.modules?.length || 0, duration: '', passingScore: ''}); setIsAddingModule(true); setEditingModuleId(null); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm">
                        <Plus className="w-5 h-5" />
                        {language === 'ar' ? "إضافة موديول جديد" : "Add New Module"}
                     </button>
                  </div>

                  {(isAddingModule || editingModuleId) && (
                    <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 mb-8 mx-4 shadow-inner">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">{language === 'ar' ? "عنوان الموديول" : "Module Title"}</label>
                          <input type="text" value={moduleFormData.title} onChange={e => setModuleFormData({ ...moduleFormData, title: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-600 font-bold" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">{language === 'ar' ? "الوصف (اختياري)" : "Description (Optional)"}</label>
                          <input type="text" value={moduleFormData.description} onChange={e => setModuleFormData({ ...moduleFormData, description: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-600 font-bold" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">{language === 'ar' ? "المدة بالدقائق (اختياري)" : "Duration in minutes (Optional)"}</label>
                          <input type="number" value={moduleFormData.duration} onChange={e => setModuleFormData({ ...moduleFormData, duration: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-600 font-bold" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">{language === 'ar' ? "درجة النجاح (اختياري)" : "Passing Score (Optional)"}</label>
                          <input type="number" value={moduleFormData.passingScore} onChange={e => setModuleFormData({ ...moduleFormData, passingScore: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-600 font-bold" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button onClick={() => { setIsAddingModule(false); setEditingModuleId(null); }} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-all">{language === 'ar' ? "إلغاء" : "Cancel"}</button>
                        <button onClick={handleSaveModule} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{language === 'ar' ? "حفظ" : "Save"}</button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-8 w-full max-w-full">
                    {/* Modules Cards */}
                    {(examInfo.modules || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((module: any) => {
                      const moduleQuestions = questions.map((q, i) => ({ q, index: i })).filter(item => item.q.moduleId === module.id);
                      const isExpanded = expandedModules.includes(module.id);
                      
                      return (
                        <div key={module.id} className="bg-white border border-slate-200 rounded-[30px] p-6 sm:p-8 space-y-6 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
                          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative z-10">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-2xl font-black text-slate-800">{module.title}</h4>
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black shrink-0">{moduleQuestions.length} {language === 'ar' ? "سؤال" : "questions"}</span>
                              </div>
                              <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                                 {module.duration && <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">🕒 {module.duration} {language === 'ar' ? "دقيقة" : "mins"}</span>}
                                 {module.passingScore && <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">🏆 {language === 'ar' ? "نجاح:" : "Pass:"} {module.passingScore}</span>}
                              </div>
                              {module.description && <p className="text-slate-500 text-sm mt-3">{module.description}</p>}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <button onClick={() => toggleModule(module.id)} className={\`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-sm \${isExpanded ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}\`}>
                                {isExpanded ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                                {language === 'ar' ? "إدارة المحتوى" : "Manage Content"}
                              </button>
                              
                              <button onClick={() => { /* TODO Preview Module */ showToast(language === 'ar' ? "قريباً" : "Coming Soon", "info"); }} className="flex items-center gap-2 px-5 py-2.5 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-2xl font-bold text-xs transition-all shadow-sm">
                                <Play className="w-4 h-4" />
                                {language === 'ar' ? "معاينة" : "Preview"}
                              </button>
                              
                              <button onClick={() => showToast(language === 'ar' ? "قريباً" : "Coming Soon", "info")} className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-2xl font-bold text-xs transition-all shadow-sm">
                                <BarChart className="w-4 h-4" />
                                {language === 'ar' ? "تقرير" : "Report"}
                              </button>
                              
                              <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block" />
                              
                              <button onClick={() => { setModuleFormData({title: module.title, description: module.description || '', order: module.order || 0, duration: module.duration?.toString() || '', passingScore: module.passingScore?.toString() || ''}); setEditingModuleId(module.id); setIsAddingModule(false); }} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm border border-slate-100 bg-white">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteModule(module.id)} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm border border-slate-100 bg-white">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="pt-6 mt-6 border-t border-slate-100 space-y-6 relative z-10 w-full animate-in slide-in-from-top-4 duration-300 fade-in">
                              <div className="flex items-center justify-between">
                                 <h5 className="font-black text-slate-700">{language === 'ar' ? "محتوى الموديول" : "Module Content"}</h5>
                                 <div className="flex gap-2">
                                    <button onClick={() => handleAddQuestion('TEXT', module.id)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[10px] uppercase transition-all shadow-sm">
                                      <Plus className="w-3 h-3" />
                                      {language === 'ar' ? "إضافة نص" : "Add Text"}
                                    </button>
                                    <button onClick={() => handleAddQuestion('MCQ', module.id)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase transition-all shadow-sm">
                                      <Plus className="w-3 h-3" />
                                      {language === 'ar' ? "إضافة سؤال" : "Add Question"}
                                    </button>
                                 </div>
                              </div>
                              <div className="space-y-4">
                                {moduleQuestions.length > 0 ? moduleQuestions.map(({ q, index }) => (
${questionCardContent}
                                )) : (
                                   <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-[24px] text-slate-400 font-bold flex flex-col items-center justify-center gap-3">
                                     <HelpCircle className="w-8 h-8 text-slate-300" />
                                     {language === 'ar' ? "لا يوجد محتوى في هذا الموديول. أضف شريحة للبدء!" : "No content in this module. Add a slide to start!"}
                                   </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* General Questions (No Module) */}
                    {(() => {
                      const generalQuestions = questions.map((q, i) => ({ q, index: i })).filter(item => !item.q.moduleId);
                      if (generalQuestions.length === 0 && (examInfo.modules?.length || 0) > 0) return null;
                      
                      const isExpanded = expandedModules.includes('general');
                      
                      return (
                        <div className="bg-white border border-slate-200 rounded-[30px] p-6 sm:p-8 space-y-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
                          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative z-10">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-2xl font-black text-slate-800">
                                  {language === 'ar' ? "أسئلة عامة (بدون موديول)" : "General Questions (No Module)"}
                                </h4>
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-black shrink-0">{generalQuestions.length} {language === 'ar' ? "سؤال" : "questions"}</span>
                              </div>
                              <p className="text-slate-500 text-sm mt-3">{language === 'ar' ? "هذه الأسئلة ستظهر لجميع الطلاب بغض النظر عن الموديول." : "These questions appear for all students regardless of module."}</p>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <button onClick={() => toggleModule('general')} className={\`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-sm \${isExpanded ? 'bg-slate-800 text-white hover:bg-slate-900' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}\`}>
                                {isExpanded ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                                {language === 'ar' ? "إدارة المحتوى" : "Manage Content"}
                              </button>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="pt-6 mt-6 border-t border-slate-100 space-y-6 relative z-10 w-full animate-in slide-in-from-top-4 duration-300 fade-in">
                              <div className="flex items-center justify-between">
                                 <h5 className="font-black text-slate-700">{language === 'ar' ? "المحتوى العام" : "General Content"}</h5>
                                 <div className="flex gap-2">
                                    <button onClick={() => handleAddQuestion('TEXT', null)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[10px] uppercase transition-all shadow-sm">
                                      <Plus className="w-3 h-3" />
                                      {language === 'ar' ? "إضافة نص" : "Add Text"}
                                    </button>
                                    <button onClick={() => handleAddQuestion('MCQ', null)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase transition-all shadow-sm">
                                      <Plus className="w-3 h-3" />
                                      {language === 'ar' ? "إضافة سؤال" : "Add Question"}
                                    </button>
                                 </div>
                              </div>
                              <div className="space-y-4">
                                {generalQuestions.length > 0 ? generalQuestions.map(({ q, index }) => (
${questionCardContent}
                                )) : (
                                   <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-[24px] text-slate-400 font-bold flex flex-col items-center justify-center gap-3">
                                     <HelpCircle className="w-8 h-8 text-slate-300" />
                                     {language === 'ar' ? "لا يوجد محتوى عام." : "No general content."}
                                   </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>`;
            
            content = content.replace(oldBlock, newRendering);
        }
    }
    
    // Add missing imports (BarChart)
    if (!content.includes("BarChart")) {
        content = content.replace("import { Plus, GripVertical,", "import { Plus, GripVertical, BarChart, Play, X, CheckCircle2,");
    }

    fs.writeFileSync(filepath, content);
}

injectUnifiedUI('D:/pj/porj/corse/lms-platform/frontend/src/app/super-admin/exams/edit/[id]/page.tsx', false);
injectUnifiedUI('D:/pj/porj/corse/lms-platform/frontend/src/app/school-admin/exams/edit/[id]/page.tsx', true);
