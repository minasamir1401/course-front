const fs = require('fs');

function makeButtonsReal(filepath, isAdminType) {
    let content = fs.readFileSync(filepath, 'utf8');

    // Replace the dummy preview button
    const oldPreview = `onClick={() => { /* TODO Preview Module */ showToast(language === 'ar' ? "قريباً" : "Coming Soon", "info"); }}`;
    const newPreview = `onClick={() => { if (moduleQuestions.length > 0) { setPreviewQuestion(moduleQuestions[0].q); } else { showToast(language === 'ar' ? "لا توجد أسئلة للمعاينة" : "No questions to preview", "error"); } }}`;
    
    // Replace the dummy report button
    const oldReport = `onClick={() => showToast(language === 'ar' ? "قريباً" : "Coming Soon", "info")}`;
    const newReport = `onClick={() => router.push(language === 'ar' ? \`/\${isAdminType}/exams/results/\${id}\` : \`/\${isAdminType}/exams/results/\${id}\`)}`;

    content = content.replace(oldPreview, newPreview);
    content = content.replace(oldReport, newReport);

    fs.writeFileSync(filepath, content);
}

makeButtonsReal('D:/pj/porj/corse/lms-platform/frontend/src/app/super-admin/exams/edit/[id]/page.tsx', 'super-admin');
makeButtonsReal('D:/pj/porj/corse/lms-platform/frontend/src/app/school-admin/exams/edit/[id]/page.tsx', 'school-admin');
