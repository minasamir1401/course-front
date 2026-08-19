const fs = require('fs');

function completeFix(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');
  
  let startIdx = lines.findIndex(l => l.includes("{isLessonModalOpen "));
  let endIdx = lines.findIndex((l, i) => i > startIdx && l.includes(") : ("));
  let before = lines.slice(0, startIdx);
  let after = lines.slice(endIdx + 1);
  
  let importsStr = `import { LessonInfoTab } from "@/components/course-editor/lesson-builder/LessonInfoTab";
import { LessonSlidesBuilder } from "@/components/course-editor/lesson-builder/LessonSlidesBuilder";
import { LessonQuestionsBuilder } from "@/components/course-editor/lesson-builder/LessonQuestionsBuilder";
import { LessonAttachmentsTab } from "@/components/course-editor/lesson-builder/LessonAttachmentsTab";`;

  let hasImport = false;
  for (let i = 0; i < before.length; i++) {
    if (before[i].includes('LessonAttachmentsTab')) {
      hasImport = true;
      break;
    }
  }
  
  if (!hasImport) {
    let dashIdx = before.findIndex(l => l.includes('import DashboardLayout'));
    before.splice(dashIdx + 1, 0, importsStr);
  }
  
  let modalStr = `      {isLessonModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[40px] w-full max-w-6xl my-auto relative shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[40px] shrink-0">
               <h2 className="text-2xl font-black text-slate-900">{t('courseCreate.lessonDetails') || "Lesson Details"}</h2>
               <button onClick={() => setIsLessonModalOpen(false)} className="p-3 bg-white rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all shadow-sm">
                 <X className="w-6 h-6" />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
              <div className="flex gap-4 mb-8 overflow-x-auto pb-4 custom-scrollbar">
                {['info', 'slides', 'assignments', 'exercises', 'attachments'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={\`px-8 py-4 rounded-2xl font-black whitespace-nowrap transition-all flex items-center gap-3 \${
                      activeTab === tab
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                        : 'bg-white text-slate-500 hover:bg-indigo-50 border border-slate-200'
                    }\`}
                  >
                    {tab === 'info' && <BookOpen className="w-5 h-5" />}
                    {tab === 'slides' && <Layout className="w-5 h-5" />}
                    {tab === 'assignments' && <FileText className="w-5 h-5" />}
                    {tab === 'exercises' && <Target className="w-5 h-5" />}
                    {tab === 'attachments' && <Upload className="w-5 h-5" />}
                    {t(\`courseCreate.tab_\${tab}\`) || tab.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="bg-white p-8 rounded-[35px] border border-slate-200 shadow-sm">
                {activeTab === 'info' && (
                   <LessonInfoTab currentLesson={currentLesson} setCurrentLesson={setCurrentLesson} language={language} showToast={showToast} metadataExcelRef={metadataExcelRef} handleExcelUpload={handleExcelUpload} />
                )}
                {activeTab === 'slides' && (
                   <LessonSlidesBuilder source="slides" currentLesson={currentLesson} setCurrentLesson={setCurrentLesson} language={language} assignmentsExcelRef={assignmentsExcelRef} questionsExcelRef={questionsExcelRef} handleAssignmentsExcelChange={handleAssignmentsExcelChange} handleQuestionsExcelChange={handleQuestionsExcelChange} handleExcelUpload={handleExcelUpload} downloadQuestionsTemplate={downloadQuestionsTemplate} />
                )}
                {activeTab === 'assignments' && (
                   <LessonQuestionsBuilder source="assignments" currentLesson={currentLesson} setCurrentLesson={setCurrentLesson} language={language} assignmentsExcelRef={assignmentsExcelRef} questionsExcelRef={questionsExcelRef} handleAssignmentsExcelChange={handleAssignmentsExcelChange} handleQuestionsExcelChange={handleQuestionsExcelChange} handleExcelUpload={handleExcelUpload} downloadQuestionsTemplate={downloadQuestionsTemplate} showQuestionForm={showQuestionForm} setShowQuestionForm={setShowQuestionForm} editingQuestionIndex={editingQuestionIndex} setEditingQuestionIndex={setEditingQuestionIndex} tempQuestion={tempQuestion} setTempQuestion={setTempQuestion} openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} />
                )}
                {activeTab === 'exercises' && (
                   <LessonQuestionsBuilder source="questions" currentLesson={currentLesson} setCurrentLesson={setCurrentLesson} language={language} assignmentsExcelRef={assignmentsExcelRef} questionsExcelRef={questionsExcelRef} handleAssignmentsExcelChange={handleAssignmentsExcelChange} handleQuestionsExcelChange={handleQuestionsExcelChange} handleExcelUpload={handleExcelUpload} downloadQuestionsTemplate={downloadQuestionsTemplate} showQuestionForm={showQuestionForm} setShowQuestionForm={setShowQuestionForm} editingQuestionIndex={editingQuestionIndex} setEditingQuestionIndex={setEditingQuestionIndex} tempQuestion={tempQuestion} setTempQuestion={setTempQuestion} openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} />
                )}
                {activeTab === 'attachments' && (
                   <LessonAttachmentsTab currentLesson={currentLesson} setCurrentLesson={setCurrentLesson} language={language} showToast={showToast} />
                )}
              </div>
            </div>
            
            <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
              <button onClick={() => setIsLessonModalOpen(false)} className="px-10 py-4 rounded-2xl bg-white border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">
                {t('courseCreate.cancelChanges') || "Cancel Changes"}
              </button>
              <button onClick={saveLesson} className="px-12 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/20 flex items-center gap-3">
                {t('courseCreate.saveLesson') || "Confirm & Save Lesson"}
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (`;

  let newContent = before.join('\n') + '\n' + modalStr + '\n' + after.join('\n');
  
  let newLines = newContent.split('\n');
  let lessonsEmptyCheck = newLines.findIndex(l => l.includes("lessons.length === 0 ? ("));
  
  let bottomBefore = newLines.slice(0, lessonsEmptyCheck);
  
  let bottomCode = [
    `        {lessons.length === 0 ? (`,
    `          <div className="bg-white border-4 border-dashed border-slate-100 rounded-[50px] p-24 text-center group cursor-pointer hover:border-indigo-500/20 transition-all" onClick={openAddLessonModal}>`,
    `            <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all">`,
    `              <Monitor className="w-12 h-12 text-slate-300 group-hover:text-indigo-600" />`,
    `            </div>`,
    `            <h3 className="text-2xl font-black text-slate-900 mb-3">{t('courseCreate.startDreamCourse') || "Start your dream course"}</h3>`,
    `            <p className="text-slate-400 font-bold max-w-sm mx-auto mb-10 leading-relaxed text-lg">{t('courseCreate.noLessonsYet') || "No lessons yet"}</p>`,
    `            <button className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-indigo-600/20">`,
    `              {t('courseCreate.addFirstLesson') || "Add First Lesson"}`,
    `            </button>`,
    `          </div>`,
    `        ) : (`,
    `          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">`,
    `            {lessons.map((lesson, index) => (`,
    `              <div key={index} className="bg-white border border-slate-100 rounded-[40px] p-8 hover:border-indigo-500/30 transition-all group relative overflow-hidden shadow-sm hover:shadow-xl">`,
    `                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-all"></div>`,
    `                <div className="flex justify-between items-start mb-6">`,
    `                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-2xl border border-indigo-100">`,
    `                    {index + 1}`,
    `                  </div>`,
    `                  <div className="flex gap-2">`,
    `                    <button`,
    `                      onClick={() => openEditLessonModal(index)}`,
    `                      className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all border border-blue-100"`,
    `                    >`,
    `                      <Edit2 className="w-5 h-5" />`,
    `                    </button>`,
    `                    <button`,
    `                      onClick={() => handleRemoveLesson(index)}`,
    `                      className="w-12 h-12 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all border border-red-100"`,
    `                    >`,
    `                      <Trash2 className="w-5 h-5" />`,
    `                    </button>`,
    `                  </div>`,
    `                </div>`,
    `                <h3 className="font-black text-slate-900 text-2xl mb-4 truncate leading-tight group-hover:text-indigo-600 transition-colors">{lesson.title || t('courseCreate.untitledLesson')}</h3>`,
    `                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-400">`,
    `                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">`,
    `                    <Monitor className={\`w-4 h-4 \${lesson.slides?.length ? 'text-indigo-600' : 'text-slate-300'}\`} />`,
    `                    {(t('courseCreate.slidesCount') || "{n} Slides").replace('{n}', String(lesson.slides?.length || 0))}`,
    `                  </div>`,
    `                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">`,
    `                    <HelpCircle className={\`w-4 h-4 \${lesson.questions?.length ? 'text-amber-500' : 'text-slate-300'}\`} />`,
    `                    {(t('courseCreate.exercisesCount') || "{n} Exercises").replace('{n}', String(lesson.questions?.length || 0))}`,
    `                  </div>`,
    `                </div>`,
    `              </div>`,
    `            ))}`,
    `          </div>`,
    `        )}`,
    `      </div>`,
    `    </div>`,
    `  </div>`,
    `)}`,
    `    </DashboardLayout>`,
    `  );`,
    `}`
  ];
  
  let finalContent = bottomBefore.join('\n') + '\n' + bottomCode.join('\n') + '\n';
  fs.writeFileSync(filePath, finalContent);
  console.log("Completely fixed", filePath);
}

completeFix('src/app/school-admin/courses/create/page.tsx');
completeFix('src/app/super-admin/courses/create/page.tsx');
