const fs = require('fs');

const files = [
  'd:/mina/front/src/app/super-admin/exams/edit/[id]/page.tsx',
  'd:/mina/front/src/app/super-admin/exams/new/page.tsx',
  'd:/mina/front/src/app/school-admin/exams/edit/[id]/page.tsx',
  'd:/mina/front/src/app/school-admin/exams/new/page.tsx'
];

const injection = `
          courseName: examData.courseName,
          section: examData.section,
          domain: examData.domain,
          learningOutcomes: examData.learningOutcomes,
          indicators: examData.indicators,
          skills: examData.skills,
          gradeTarget: examData.gradeTarget,
`;

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Add to handleSubmit
    if (!content.includes('courseName: examData.courseName')) {
        content = content.replace(/(status: "PUBLISHED",)/g, '$1\n' + injection);
    }
    
    // Add to autoSaveHandler
    if (content.includes('autoSaveHandler') && !content.includes('courseName: examData.courseName,')) {
        // Find autoSaveHandler payload
        // We know it sends status: "DRAFT" in autoSaveHandler
        content = content.replace(/(status: "DRAFT",)/g, '$1\n' + injection);
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated payloads in ' + file);
  }
});
