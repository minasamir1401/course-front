const fs = require('fs');

const basePaths = [
  'd:/mina/front/src/app/super-admin/exams/new',
  'd:/mina/front/src/app/super-admin/exams/edit/[id]',
  'd:/mina/front/src/app/school-admin/exams/new',
  'd:/mina/front/src/app/school-admin/exams/edit/[id]'
];

for (const basePath of basePaths) {
  const hookPath = basePath + '/hooks/useModuleManagement.ts';
  const builderPath = basePath + '/components/QuestionsBuilder.tsx';

  if (fs.existsSync(hookPath)) {
    let hookContent = fs.readFileSync(hookPath, 'utf8');
    
    // Fix downloadAdvancedMetadataTemplate to use Arabic headers if language === 'ar'
    hookContent = hookContent.replace(
      /wsData\.push\(\['Question ID', 'Question Text', 'Exam', 'Section', 'Domain', 'Learning Outcomes', 'Indicators', 'Skill', 'Subskill', 'Micro Skill', 'Difficulty', 'DOK', 'Cognitive', 'Error Pattern', 'Estimated Time'\]\);/,
      `const headersAr = ['Question ID', 'Question Text', 'الاختبار', 'القسم', 'المجال', 'نواتج التعلم', 'المؤشرات', 'المهارة', 'المهارة الفرعية', 'المهارة الدقيقة', 'الصعوبة', 'عمق المعرفة (DOK)', 'المستوى المعرفي', 'نمط الخطأ', 'Estimated Time'];
    const headersEn = ['Question ID', 'Question Text', 'Exam', 'Section', 'Domain', 'Learning Outcomes', 'Indicators', 'Skill', 'Subskill', 'Micro Skill', 'Difficulty', 'DOK', 'Cognitive', 'Error Pattern', 'Estimated Time'];
    wsData.push(language === 'ar' ? headersAr : headersEn);`
    );

    hookContent = hookContent.replace(
      /wsData\.push\(\['', 'Sample Question\.\.\.', 'مقدمة في الفيزياء', 'القسم الاول', 'الفيزياء', 'Student will be able to\.\.\.', 'Identifies Basic Concepts', 'General', 'Specific', 'Micro', 'Medium', 'DOK 2', 'Application', '', '5 mins'\]\);/,
      `if (language === 'ar') {
        wsData.push(['', 'نص السؤال...', 'مقدمة في الفيزياء', 'القسم الاول', 'الفيزياء', 'Student will be able to...', 'Identifies Basic Concepts', 'General', 'Specific', 'Micro', 'Medium', 'DOK 2', 'Application', '', '5 mins']);
      } else {
        wsData.push(['', 'Sample Question...', 'Physics Intro', 'Section One', 'Physics', 'Student will be able to...', 'Identifies Basic Concepts', 'General', 'Specific', 'Micro', 'Medium', 'DOK 2', 'Application', '', '5 mins']);
      }`
    );

    fs.writeFileSync(hookPath, hookContent);
  }

  if (fs.existsSync(builderPath)) {
    let builderContent = fs.readFileSync(builderPath, 'utf8');
    
    // Change labelAr for estimatedTime to 'Estimated Time' so the downloaded template matches
    builderContent = builderContent.replace(
      /\{\s*key:\s*'estimatedTime',\s*labelAr:\s*'الوقت المقدر',\s*labelEn:\s*'Estimated Time'\s*\}/g,
      "{ key: 'estimatedTime', labelAr: 'Estimated Time', labelEn: 'Estimated Time' }"
    );
    
    fs.writeFileSync(builderPath, builderContent);
  }
}
console.log('Fixed metadata templates');
