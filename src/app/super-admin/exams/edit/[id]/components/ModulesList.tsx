// @ts-nocheck
import React from 'react';
import { Monitor, HelpCircle, Edit2, Trash2 } from 'lucide-react';
import ModuleQuestionCollectionAction from '@/components/exams/ModuleQuestionCollectionAction';

export const ModulesList = (props: any) => {
  const { modules, showSettings, openAddModuleModal, language, openEditModuleModal, setActiveTab, handleRemoveModule } = props;

  return (
    <div className={`space-y-8 ${showSettings ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
      {modules.length === 0 ? (
        <div className="bg-white border-4 border-dashed border-slate-100 rounded-[50px] p-24 text-center group cursor-pointer hover:border-indigo-500/20 transition-all" onClick={openAddModuleModal}>
          <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all">
            <Monitor className="w-12 h-12 text-slate-300 group-hover:text-indigo-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-3">{language === 'ar' ? 'إبدأ بناء امتحانك!' : 'Start Building Your Exam!'}</h3>
          <p className="text-slate-400 font-bold max-w-sm mx-auto mb-10 leading-relaxed text-lg">{language === 'ar' ? 'لم يتم إضافة أي موديولات بعد' : 'No modules added yet'}</p>
          <button className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-indigo-600/20">
            {language === 'ar' ? 'إنشاء موديول' : 'Create Module'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {modules.map((lesson: any, index: number) => (
            (() => {
              const examCount = lesson.examsCount ?? lesson.subExams?.length ?? 0;
              const questionCount = lesson.questionsCount ?? ((lesson.questions?.length || 0) + (lesson.subExams || []).reduce((total: number, exam: any) => total + (exam.questionsCount ?? exam._count?.questions ?? exam.questions?.length ?? 0), 0));
              return (
            <div key={index} className="bg-white border border-slate-100 rounded-[24px] p-4 hover:border-indigo-500/30 transition-all group relative overflow-hidden shadow-sm hover:shadow-md cursor-pointer flex items-center gap-4"
              onClick={() => { openEditModuleModal(index); setActiveTab('exercises'); }}>
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-all"></div>
              
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl border border-indigo-100">
                {index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-black text-slate-900 text-lg truncate group-hover:text-indigo-600 transition-colors">
                  {lesson.title || (language === 'ar' ? 'موديول بدون عنوان' : 'Untitled Module')}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs font-bold text-slate-400">
                  <HelpCircle className={`w-3.5 h-3.5 ${lesson.subExams?.length ? 'text-indigo-600' : 'text-slate-300'}`} />
                  {language === 'ar' ? `${examCount} اختبارات · ${questionCount} سؤال` : `${examCount} Exams · ${questionCount} Questions`}
                </div>
                <ModuleQuestionCollectionAction module={lesson} {...props} role="SUPER_ADMIN" />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); openEditModuleModal(index); }}
                  className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all border border-blue-100"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleRemoveModule(index); }}
                  className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all border border-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
              );
            })()
          ))}
          
          
        </div>
      )}
    </div>
  );
};
