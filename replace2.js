const fs = require('fs');

const file1 = 'd:/mina/front/src/app/super-admin/exams/new/hooks/useModuleManagement.ts';
const file2 = 'd:/mina/front/src/app/school-admin/exams/new/hooks/useModuleManagement.ts';

function replaceInFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    const startStr = "let downloadQuestionsTemplate = (type: 'questions' | 'assignments') => {";
    const endStr = "    ];";
    
    const startIndex = content.indexOf(startStr);
    if (startIndex === -1) {
        console.log("Could not find startStr in", filepath);
        return;
    }
    
    const endIndex = content.indexOf(endStr, startIndex) + endStr.length;
    
    const replacement = `let downloadQuestionsTemplate = (type: 'questions' | 'assignments') => {
    const wsData = [
      [
        language === 'ar' ? "نص السؤال" : "Question",
        language === 'ar' ? "الخيار 1" : "Option 1",
        language === 'ar' ? "الخيار 2" : "Option 2",
        language === 'ar' ? "الخيار 3" : "Option 3",
        language === 'ar' ? "الخيار 4" : "Option 4",
        language === 'ar' ? "الإجابة الصحيحة" : "Correct Answer",
        language === 'ar' ? "الدرجة" : "Points",
        language === 'ar' ? "التفسير" : "Explanation"
      ],
      [
        language === 'ar' ? "ما هو ناتج 5 + 5؟" : "What is 5 + 5?",
        "8", "9", "10", "11",
        "10", "1",
        language === 'ar' ? "الجمع الصحيح هو 10 لأن 5 زائد 5 يساوي 10" : "5 + 5 is 10"
      ],
      [
        language === 'ar' ? "الأرض كروية الشكل." : "The earth is round.",
        language === 'ar' ? "صحيح" : "True", language === 'ar' ? "خطأ" : "False", "", "",
        language === 'ar' ? "صحيح" : "True", "1",
        ""
      ]
    ];`;
    
    content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
    fs.writeFileSync(filepath, content);
    console.log("Replaced in", filepath);
}

replaceInFile(file1);
replaceInFile(file2);
