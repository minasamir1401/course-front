const fs = require('fs');

const files = [
  'd:/mina/front/src/app/super-admin/exams/edit/[id]/page.tsx',
  'd:/mina/front/src/app/super-admin/exams/new/page.tsx',
  'd:/mina/front/src/app/school-admin/exams/edit/[id]/page.tsx',
  'd:/mina/front/src/app/school-admin/exams/new/page.tsx'
];

const exportFunction = "  const exportQuestionsToExcel = (questionsToExport: any[], filename = 'questions_export.xlsx') => {\n    if (!questionsToExport || questionsToExport.length === 0) {\n      showToast(language === 'ar' ? 'لا توجد أسئلة لتصديرها' : 'No questions to export', 'error');\n      return;\n    }\n\n    const wsData = [\n      [\n        language === 'ar' ? 'نص السؤال' : 'Question Text',\n        language === 'ar' ? 'نوع السؤال' : 'Question Type',\n        language === 'ar' ? 'الخيار 1' : 'Option 1',\n        language === 'ar' ? 'الخيار 2' : 'Option 2',\n        language === 'ar' ? 'الخيار 3' : 'Option 3',\n        language === 'ar' ? 'الخيار 4' : 'Option 4',\n        language === 'ar' ? 'الخيار 5' : 'Option 5',\n        language === 'ar' ? 'الإجابة الصحيحة' : 'Correct Answer',\n        language === 'ar' ? 'الدرجة' : 'Points',\n        language === 'ar' ? 'المؤشرات' : 'Indicators',\n        language === 'ar' ? 'مخرجات التعلم' : 'Learning Outcomes',\n        language === 'ar' ? 'المهارة' : 'Skill',\n        language === 'ar' ? 'المهارة الفرعية' : 'Subskill',\n        language === 'ar' ? 'المهارة الدقيقة' : 'Micro Skill',\n        language === 'ar' ? 'مستوى الصعوبة' : 'Difficulty',\n        'DOK',\n        language === 'ar' ? 'المستوى المعرفي' : 'Cognitive',\n        language === 'ar' ? 'نمط الخطأ' : 'Error Pattern',\n        language === 'ar' ? 'الوقت المقدر' : 'Estimated Time',\n        language === 'ar' ? 'التفسير' : 'Explanation'\n      ]\n    ];\n\n    questionsToExport.forEach(q => {\n      let optionsArray = [];\n      if (typeof q.options === 'string') {\n        try { optionsArray = JSON.parse(q.options); } catch (e) { optionsArray = [q.options]; }\n      } else if (Array.isArray(q.options)) {\n        optionsArray = q.options;\n      }\n\n      wsData.push([\n        q.text ? q.text.replace(/<[^>]*>?/gm, '') : '',\n        q.questionType || q.type || 'MCQ',\n        optionsArray[0] || '',\n        optionsArray[1] || '',\n        optionsArray[2] || '',\n        optionsArray[3] || '',\n        optionsArray[4] || '',\n        typeof q.correctAnswer === 'string' ? q.correctAnswer : JSON.stringify(q.correctAnswer || ''),\n        q.points || 1,\n        q.indicators || q.indicator || '',\n        q.learningOutcome || q.learningOutcomes || '',\n        q.skill || '',\n        q.subskill || '',\n        q.microSkill || '',\n        q.level || 'Medium',\n        q.dok || '',\n        q.cognitive || 'Knowledge',\n        q.errorPattern || '',\n        q.estimatedTime || '',\n        q.explanation || ''\n      ]);\n    });\n\n    const ws = XLSX.utils.aoa_to_sheet(wsData);\n    const wb = XLSX.utils.book_new();\n    XLSX.utils.book_append_sheet(wb, ws, 'Questions');\n    XLSX.writeFile(wb, filename);\n    showToast(language === 'ar' ? 'تم تصدير الأسئلة بنجاح' : 'Questions exported successfully', 'success');\n  };\n";

const exportButtonStr = "                    <button onClick={() => exportQuestionsToExcel(modules[mIdx]?.questions || [], 'module_' + (mIdx+1) + '_questions.xlsx')} className=\"flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl font-bold text-xs transition-all shadow-sm\">\n                      <Download className=\"w-3.5 h-3.5\" />\n                      {language === 'ar' ? 'تصدير Excel' : 'Export Excel'}\n                    </button>\n";

const exportStandaloneStr = "<button onClick={() => exportQuestionsToExcel(standaloneQuestions, 'standalone_questions.xlsx')} className=\"flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl font-bold text-sm transition-all shadow-sm\">\n                        <Download className=\"w-4 h-4\" />\n                        {language === 'ar' ? 'تصدير الأسئلة Excel' : 'Export Questions Excel'}\n                      </button>\n";

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Add export function before return
    if (!content.includes('exportQuestionsToExcel')) {
        content = content.replace(/(const parseQuestionsFromExcel =)/, exportFunction + '\n  $1');
    }

    // Inject export button into the module's questions header
    if (!content.includes('exportQuestionsToExcel(modules[mIdx]?.questions')) {
        content = content.replace(
            /(<div className="flex items-center gap-2">\s*<button\s*onClick=\{\(\) => setExpandedModules\()/g,
            exportButtonStr + '\n$1'
        );
    }
    
    // Also inject for standalone questions
    if (!content.includes('exportQuestionsToExcel(standaloneQuestions')) {
      content = content.replace(
          /(\{standaloneQuestions\.length > 0 && \(\s*<button\s*onClick=\{\(\) => setShowBulkMoveModal\(true\)\})/g,
          exportStandaloneStr + '\n$1'
      );
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated export ' + file);
  }
});
