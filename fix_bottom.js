const fs = require('fs');

function fixBottom(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');
  
  let lessonsEmptyCheck = lines.findIndex(l => l.includes("lessons.length === 0 ? ("));
  let newLines = lines.slice(0, lessonsEmptyCheck);
  
  let endCode = [
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
  
  let newContent = newLines.concat(endCode).join('\n');
  fs.writeFileSync(filePath, newContent);
}

fixBottom('src/app/school-admin/courses/create/page.tsx');
fixBottom('src/app/super-admin/courses/create/page.tsx');
