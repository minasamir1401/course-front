const fs = require('fs');

const modalHtml = `      {/* Move Question Modal */}
      {movingQuestionIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMovingQuestionIndex(null)}></div>
          <div className="relative bg-slate-50/95 backdrop-blur-xl rounded-[40px] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-200/50">
            <div className="px-8 py-6 border-b border-slate-200/50 flex items-center justify-between bg-white/50 sticky top-0 z-20">
              <h3 className="font-black text-xl text-slate-800 flex items-center gap-3">
                <FolderOutput className="w-6 h-6 text-indigo-600" />
                {language === 'ar' ? 'نقل السؤال إلى الموديولات - اختر الوجهة' : 'Move Question to Modules - Select Destination'}
              </h3>
              <button onClick={() => setMovingQuestionIndex(null)} className="w-10 h-10 bg-white hover:bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center transition-all shadow-sm border border-slate-200/50 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1">
              <div className="bg-amber-50 border border-amber-200 text-amber-700 p-5 rounded-3xl text-sm font-bold flex gap-4 mb-8 shadow-sm">
                <span className="text-2xl shrink-0">⚠️</span>
                <div>
                  <p className="text-base">{language === 'ar' ? 'تنبيه: سيتم نقل هذا السؤال ليكون داخل الموديول الذي ستختاره أدناه.' : 'Notice: This question will be moved into the module you select below.'}</p>
                  <p className="mt-1 text-amber-600">{language === 'ar' ? 'بعد النقل، سيتم إزالة هذا السؤال من قائمة الأسئلة المستقلة.' : 'After moving, this question will be removed from the standalone questions list.'}</p>
                </div>
              </div>
              <div className="space-y-12 w-full max-w-full">
                <div className="bg-white border-2 border-indigo-50 rounded-[40px] p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden transition-all hover:border-indigo-200">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -z-10"></div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-2xl font-black text-slate-800">{examData?.title || 'Exam'}</h4>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black">
                          {modules.length} {language === 'ar' ? 'موديول' : 'Modules'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 border-t-2 border-indigo-100 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h5 className="font-black text-slate-800">{language === 'ar' ? 'الموديولات المتاحة' : 'Available Modules'}</h5>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {modules.length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-slate-500 font-bold">{language === 'ar' ? "لا يوجد موديولات متاحة. قم بإنشاء موديول أولاً." : "No modules available. Create a module first."}</p>
                        </div>
                      ) : (
                        modules.map((m, idx) => (
                          <div key={idx} className="border-2 border-slate-100 rounded-[24px] overflow-hidden bg-white shadow-sm transition-all hover:border-indigo-100 p-5">
                            <div className="flex items-center justify-between gap-4 transition-all group">
                              <div className="flex items-center gap-4 flex-1 overflow-hidden">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600">
                                  <BookOpen className="w-5 h-5" />
                                </div>
                                <div className="overflow-hidden">
                                  <h6 className="font-black text-base truncate text-slate-800">
                                    {m.title || (language === 'ar' ? 'موديول بدون عنوان' : 'Untitled Module')}
                                  </h6>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button 
                                  onClick={() => handleMoveToModule(idx)}
                                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                                >
                                  <FolderOutput className="w-4 h-4" />
                                  {language === 'ar' ? 'نقل إلى هذا الموديول' : 'Move to this module'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>`;

['src/app/super-admin/exams/edit/[id]/page.tsx', 'src/app/school-admin/exams/edit/[id]/page.tsx'].forEach(p => {
  let f = fs.readFileSync(p, 'utf8');
  
  // 1. Replace the Move Modal
  let start = f.indexOf('{/* Move Question Modal */}');
  let end = f.lastIndexOf('</DashboardLayout>');
  if (start !== -1 && end !== -1) {
    f = f.substring(0, start) + modalHtml + f.substring(end + '</DashboardLayout>'.length);
  }

  // 2. Add Preview/Report Buttons
  const targetBtn = `<button 
                            onClick={(e) => { e.stopPropagation(); openEditModuleModal(index); }}
                            className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all border border-blue-100"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>`;
  
  const reportUrl = p.includes('school-admin') ? '/school-admin/exams/results/' : '/super-admin/exams/results/';

  const newBtns = `<button 
                            onClick={(e) => { e.stopPropagation(); window.open('/exams/' + examId + '?moduleId=' + lesson.id, '_blank'); }}
                            title={language === 'ar' ? 'معاينة الموديول' : 'Preview Module'}
                            className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all border border-emerald-100"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); window.open('${reportUrl}' + examId + '?moduleId=' + lesson.id, '_blank'); }}
                            title={language === 'ar' ? 'التقرير' : 'Report'}
                            className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white flex items-center justify-center transition-all border border-amber-100"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          ` + targetBtn;

  if (f.includes(targetBtn)) {
      f = f.replaceAll(targetBtn, newBtns);
  }

  fs.writeFileSync(p, f);
});
