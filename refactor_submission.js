const fs = require('fs');
const filepath = 'D:/pj/porj/corse/lms-platform/frontend/src/app/super-admin/exams/submissions/[id]/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// Find where the main `return (` starts in `SuperAdminSubmissionDetailsPage`
const returnMatch = content.indexOf('  return (\n    <DashboardLayout>') === -1 
  ? content.indexOf('  return (\r\n    <DashboardLayout>')
  : content.indexOf('  return (\n    <DashboardLayout>');

if (returnMatch === -1) {
    console.log("Could not find main return block");
    process.exit(1);
}

// First, replace the icons imported to ensure we have everything
content = content.replace("import { CheckCircle2, XCircle, ChevronRight, LayoutDashboard, RefreshCw, Award, Target, Clock, User, Mail, ArrowRight, FileText, BarChart3 } from 'lucide-react';", 
"import { CheckCircle2, XCircle, ChevronRight, LayoutDashboard, RefreshCw, Award, Target, Clock, User, Mail, ArrowRight, FileText, BarChart3, HelpCircle, Layers } from 'lucide-react';\nimport Image from 'next/image';");

const mainContentStartIndex = returnMatch;

const newRendering = `  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 rtl pb-20" dir="rtl">
        
        {/* Header with Navigation and Logo */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()} 
              className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm group"
            >
              <ArrowRight className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm bg-white flex items-center justify-center p-1 border border-slate-100">
                 <Image src="/logo.png" alt="Klevro Logo" width={56} height={56} className="object-contain" />
               </div>
               <div>
                 <h1 className="text-3xl font-black text-slate-800">تقرير إجابة الطالب</h1>
                 <p className="text-slate-500 font-medium">مراجعة تفصيلية لأداء الطالب في الامتحان.</p>
               </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className={\`px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-sm \${isPassed ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}\`}>
                {isPassed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                {isPassed ? "حالة الطالب: ناجح" : "حالة الطالب: راسب"}
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Student Info & Summary */}
          <div className="lg:col-span-1 space-y-8">
            {/* Student Card */}
            <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[100px] -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-indigo-600 text-white rounded-3xl flex items-center justify-center text-3xl font-black mb-6 shadow-xl shadow-indigo-100 uppercase">
                  {submission.user.name?.charAt(0) || '?'}
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">{submission.user.name || 'مستخدم'}</h3>
                <p className="text-slate-400 font-bold mb-6 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {submission.user.username || '-'}
                </p>
                
                <div className="w-full grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">النتيجة</p>
                      <p className="text-xl font-black text-slate-800">{Math.round(submission.percentage || 0)}%</p>
                   </div>
                   <div className="text-right border-r border-slate-50 pr-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الدرجة</p>
                      <p className="text-xl font-black text-slate-800">{submission.totalScore} / {submission.exam.questions.reduce((acc, q) => acc + (q.points || 1), 0)}</p>
                   </div>
                </div>
              </div>
            </div>

            {/* Exam Summary Card */}
            <div className="bg-slate-900 text-white p-8 rounded-[35px] shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
               <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-tr-[100px] -ml-10 -mb-10"></div>
               <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">تفاصيل الامتحان</h4>
               <h3 className="text-2xl font-black mb-6 leading-tight">{submission.exam.title}</h3>
               
               <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white/60">
                     <FileText className="w-5 h-5" />
                     <span className="font-bold text-sm">{submission.exam.type}</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/60">
                     <BarChart3 className="w-5 h-5" />
                     <span className="font-bold text-sm">عدد الأسئلة: {submission.exam.questions.length}</span>
                  </div>
                  {submission.exam.modules && submission.exam.modules.length > 0 && (
                     <div className="flex items-center gap-3 text-white/60">
                        <Layers className="w-5 h-5" />
                        <span className="font-bold text-sm">الموديولات: {submission.exam.modules.length}</span>
                     </div>
                  )}
                  <div className="flex items-center gap-3 text-white/60">
                     <Clock className="w-5 h-5" />
                     <span className="font-bold text-sm">تاريخ التسليم: {new Date(submission.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
               </div>
            </div>
            
            {/* Module Summaries */}
            {submission.exam.modules && submission.exam.modules.length > 0 && (
               <div className="space-y-4">
                  <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-3 px-2">
                     <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                       <BarChart3 className="w-4 h-4" />
                     </div>
                     ملخص الموديولات
                  </h3>
                  {submission.exam.modules.map((mod: any, mIdx: number) => {
                     // Calculate stats for this module
                     const modAnswers = submission.answers.filter((a: any) => a.question.moduleId === mod.id);
                     const totalPoints = modAnswers.reduce((acc: number, a: any) => acc + (a.question.points || 1), 0);
                     const earnedPoints = modAnswers.filter((a: any) => a.isCorrect).reduce((acc: number, a: any) => acc + (a.question.points || 1), 0);
                     const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
                     const timeTaken = modAnswers.reduce((acc: number, a: any) => acc + (a.timeTaken || 0), 0);
                     const isModPassed = !mod.passingScore || percentage >= mod.passingScore;
                     
                     return (
                        <div key={mod.id} className={\`p-6 rounded-3xl border \${isModPassed ? 'bg-white border-slate-100 hover:border-emerald-200' : 'bg-rose-50/30 border-rose-100 hover:border-rose-200'} transition-all shadow-sm\`}>
                           <div className="flex justify-between items-start mb-4">
                              <h4 className="font-black text-slate-800">{mod.title}</h4>
                              <span className={\`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest \${isModPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}\`}>
                                 {isModPassed ? 'ناجح' : 'راسب'}
                              </span>
                           </div>
                           <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mb-3">
                              <span className="bg-slate-50 px-2 py-1 rounded-md">{Math.round(percentage)}%</span>
                              <span className="bg-slate-50 px-2 py-1 rounded-md">{earnedPoints} / {totalPoints} درجة</span>
                              <span className="bg-slate-50 px-2 py-1 rounded-md">{Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, '0')}</span>
                           </div>
                           <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div className={\`h-full rounded-full \${isModPassed ? 'bg-emerald-500' : 'bg-rose-500'}\`} style={{ width: \`\${percentage}%\` }}></div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            )}
          </div>

          {/* Right Column: Detailed Answers */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2 mb-2">
               <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                   <RefreshCw className="w-5 h-5" />
                 </div>
                 مراجعة الإجابات
               </h3>
            </div>

            {(() => {
               const modules = submission.exam.modules && submission.exam.modules.length > 0 
                  ? submission.exam.modules 
                  : [{ id: null, title: 'الأسئلة' }];
               
               return modules.map((mod: any, modIndex: number) => {
                  const modAnswers = submission.answers.filter((a: any) => a.question.moduleId === mod.id || (!a.question.moduleId && mod.id === null));
                  
                  if (modAnswers.length === 0) return null;

                  return (
                     <div key={mod.id || 'general'} className="mb-10 space-y-6">
                        {mod.id && (
                           <div className="flex items-center gap-4 px-2 py-2">
                              <div className="h-px bg-slate-200 flex-1"></div>
                              <h4 className="font-black text-indigo-900 bg-indigo-50 px-6 py-2 rounded-full border border-indigo-100 shadow-sm">{mod.title}</h4>
                              <div className="h-px bg-slate-200 flex-1"></div>
                           </div>
                        )}
                        
                        {modAnswers.map((answer: any, index: number) => {
                           const isCorrect = answer.isCorrect;
                           const qText = answer.question?.text || "";
                           const hasCodeBlock = qText.includes("<pre") || qText.includes("<code");

                           return (
                             <div 
                               key={answer.id}
                               className={\`bg-white rounded-[32px] shadow-sm border overflow-hidden transition-all \${isCorrect ? 'border-slate-100 hover:border-emerald-200' : 'border-rose-100/50 hover:border-rose-300'}\`}
                             >
                               <div className="p-8 md:p-10">
                                 <div className="flex justify-between items-start mb-8">
                                   <div className="flex items-center gap-4">
                                     <span className={\`w-10 h-10 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-sm \${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}\`}>
                                       {index + 1}
                                     </span>
                                     <div className="flex flex-col">
                                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                                         {answer.question?.type || 'سؤال'}
                                       </span>
                                       <div className="flex items-center gap-2">
                                         <span className={\`text-xs font-bold px-2 py-0.5 rounded-md \${isCorrect ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}\`}>
                                           {isCorrect ? 'صحيح' : 'خاطئ'}
                                         </span>
                                         <span className="text-xs font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md">
                                           <Clock className="w-3 h-3" /> {answer.timeTaken || 0} ثانية
                                         </span>
                                       </div>
                                     </div>
                                   </div>
                                 </div>

                                 <HtmlRenderer html={qText} tag="div" className={\`text-xl md:text-2xl font-bold text-slate-800 leading-relaxed mb-8 \${hasCodeBlock ? 'prose-pre:bg-[#1a1a2e] prose-pre:text-slate-300' : ''}\`} />

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                   <div>
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">إجابة الطالب</p>
                                     <div className={\`p-4 rounded-xl font-bold text-sm md:text-base border-2 \${isCorrect ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}\`}>
                                       <HtmlRenderer html={answer.selectedAnswer || 'لم يتم الإجابة'} />
                                     </div>
                                   </div>
                                   <div>
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">الإجابة الصحيحة</p>
                                     <div className="p-4 rounded-xl font-bold text-sm md:text-base bg-emerald-50 text-emerald-700 border-2 border-emerald-200">
                                       <HtmlRenderer html={answer.question?.correctAnswer || ''} />
                                     </div>
                                   </div>
                                 </div>

                                 {/* {renderExplanation(answer.question?.explanation, true)} */}
                               </div>
                             </div>
                           );
                        })}
                     </div>
                  );
               });
            })()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
`;

content = content.substring(0, mainContentStartIndex) + newRendering;
fs.writeFileSync(filepath, content);
