const fs = require('fs');

const file1 = 'd:/mina/front/src/app/super-admin/exams/new/hooks/useModuleManagement.ts';
const file2 = 'd:/mina/front/src/app/school-admin/exams/new/hooks/useModuleManagement.ts';

let content = fs.readFileSync(file1, 'utf8');

const target = `  let downloadQuestionsTemplate = (type: 'questions' | 'assignments') => {
    const wsData = [
      [
        language === 'ar' ? "نص السؤال" : "Question Text",
        language === 'ar' ? "نوع السؤال" : "Question Type",
        language === 'ar' ? "الخيار 1" : "Option 1",
        language === 'ar' ? "الخيار 2" : "Option 2",
        language === 'ar' ? "الخيار 3" : "Option 3",
        language === 'ar' ? "الخيار 4" : "Option 4",
        language === 'ar' ? "الخيار 5" : "Option 5",
        language === 'ar' ? "الإجابة الصحيحة" : "Correct Answer",
        language === 'ar' ? "الإجابات الصحيحة المتعددة" : "Correct Answers",
        language === 'ar' ? "الدرجة" : "Points",
        language === 'ar' ? "المهارة" : "Skill",
        language === 'ar' ? "المعيار" : "Standard",
        language === 'ar' ? "المؤشر" : "Indicator",
        language === 'ar' ? "ناتج التعلم" : "Learning Outcome",
        language === 'ar' ? "مستوى الصعوبة" : "Difficulty Level",
        "DOK",
        language === 'ar' ? "رابط الفيديو" : "Video URL",
        language === 'ar' ? "التفسير" : "Explanation"
      ],
      [
        language === 'ar' ? "ما هو ناتج 5 + 5؟" : "What is 5 + 5?",
        "MCQ",
        "8", "9", "10", "11", "",
        "10", "", "1", "Problem Solving",
        "Standard 1: Operations",
        "Indicator 1.1: Addition",
        "LO: Students can add numbers correctly",
        "Foundation", "DOK 1",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        language === 'ar' ? "الجمع الصحيح هو 10 لأن 5 زائد 5 يساوي 10" : "5 + 5 is 10"
      ],
      [
        language === 'ar' ? "الأرض كروية الشكل." : "The earth is round.",
        "TRUE_FALSE",
        "", "", "", "", "",
        language === 'ar' ? "صحيح" : "True", "", "1", "Observation",
        "Standard 2: Physical Geography",
        "Indicator 2.1: Earth Shape",
        "LO: Understands planet earth's shape",
        "Foundation", "DOK 2", "", ""
      ],
      [
        language === 'ar' ? "حدد قارات العالم القديم:" : "Select the ancient world continents:",
        "MULTI_SELECT",
        language === 'ar' ? "آسيا" : "Asia", 
        language === 'ar' ? "أوروبا" : "Europe", 
        language === 'ar' ? "أفريقيا" : "Africa", 
        language === 'ar' ? "أستراليا" : "Australia", "",
        "",
        language === 'ar' ? "آسيا, أوروبا, أفريقيا" : "Asia, Europe, Africa",
        "2", "General",
        "Standard 3: Ancient History",
        "Indicator 3.1: Continents",
        "LO: Identifies old world continents",
        "Medium", "", "", ""
      ]
    ];`;

const replacement = `  let downloadQuestionsTemplate = (type: 'questions' | 'assignments') => {
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

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(file1, content);
    fs.writeFileSync(file2, content);
    console.log("Successfully replaced in both files.");
} else {
    console.log("Target not found!");
}
