const fs = require('fs');

let code = fs.readFileSync('src/app/super-admin/exams/new/components/QuestionsBuilder.tsx', 'utf8');

const missingBlock = `  const renderQuestionsBuilderFunc = () => {
    const list = (source === 'questions' && activeSubExamIndex !== null && currentModule.subExams && currentModule.subExams[activeSubExamIndex]) ? (currentModule.subExams[activeSubExamIndex].questions || []) : (currentModule[source] || []);
    const headerLabel = source === 'assignments'
      ? (language === 'ar' ? 'واجبات وتكليفات الدرس (Assignments)' : 'Lesson Assignments')
      : (language === 'ar' ? 'اختبار (Exam)' : 'Exam');

    const headerDesc = source === 'assignments'
      ? (language === 'ar' ? 'قم بإضافة التكليفات التطبيقية والواجبات المنزلية للطلاب' : 'Add application homework and assignments for students')
      : (language === 'ar' ? 'قم بإضافة أسئلة لاختبار الطالب في هذا الموديول' : 'Add questions to test student in this module');

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {examData?.title && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">{language === 'ar' ? 'الاختبار الحالي' : 'Current Exam'}</p>
                <h3 className="text-lg font-black text-indigo-900">{examData.title}</h3>
              </div>
            </div>
          </div>
        )}
        <input
          type="file"
          ref={source === 'assignments' ? assignmentsExcelRef : questionsExcelRef}
          style={{ display: 'none' }}
          accept=".xlsx,.xls"
          onChange={source === 'assignments' ? handleAssignmentsExcelChange : handleQuestionsExcelChange}
        />
        <input
          type="file"
          ref={advancedMetadataExcelRef}
          style={{ display: 'none' }}
          accept=".xlsx,.xls"
          onChange={(e) => handleAdvancedMetadataExcelChange(e)}
        />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-indigo-600" />`;

const searchStr = '              {headerLabel}';

const lines = code.split('\\n');
const insertIndex = lines.findIndex(l => l.includes('{headerLabel}'));

if (insertIndex > -1) {
  // delete any stray "{headerLabel}"
  lines[insertIndex] = missingBlock + '\\n' + searchStr;
  fs.writeFileSync('src/app/super-admin/exams/new/components/QuestionsBuilder.tsx', lines.join('\\n'));
} else {
  console.log("Could not find {headerLabel}");
}
