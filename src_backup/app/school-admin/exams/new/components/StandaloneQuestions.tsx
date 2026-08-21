// @ts-nocheck
import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

export const StandaloneQuestions = (props: any) => {
  const { standaloneQuestions, visibleStandaloneCount, language, handleEditStandaloneQuestion, removeStandaloneQuestion, setVisibleStandaloneCount } = props;

  return (
    <div className="mt-12 standalone-questions-section">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {standaloneQuestions.slice(0, visibleStandaloneCount).map((q: any, index: number) => (
          <div key={index} className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500">
                    {index + 1}
                  </div>
                  <div>
                    <span className="text-xs font-black px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full">{q.type || 'MCQ'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.preventDefault(); handleEditStandaloneQuestion(index); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.preventDefault(); removeStandaloneQuestion(index); }} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
            </div>
            <div className="text-slate-800 font-bold line-clamp-3 text-sm flex-1" dangerouslySetInnerHTML={{ __html: q.text }} />
            <div className="text-xs font-bold text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-auto">
              {language === 'ar' ? 'الإجابة:' : 'Answer:'} <span className="text-emerald-600 ml-1">{q.correctAnswer || (q.correctAnswers?.join(', ') || '-')}</span>
            </div>
          </div>
        ))}
        {standaloneQuestions.length > visibleStandaloneCount && (
          <div className="col-span-1 md:col-span-2 flex justify-center mt-6">
            <button
              onClick={(e) => { e.preventDefault(); setVisibleStandaloneCount((prev: number) => prev + 50); }}
              className="bg-indigo-50 text-indigo-600 px-8 py-3 rounded-2xl font-black hover:bg-indigo-100 hover:scale-105 transition-all shadow-sm"
            >
              {language === 'ar' ? 'عرض المزيد من الأسئلة' : 'Load More Questions'} ({standaloneQuestions.length - visibleStandaloneCount} {language === 'ar' ? 'متبقي' : 'Remaining'})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
