const fs = require('fs');

const pagePaths = [
  'd:/mina/front/src/app/super-admin/exams/new/page.tsx',
  'd:/mina/front/src/app/super-admin/exams/edit/[id]/page.tsx',
  'd:/mina/front/src/app/school-admin/exams/new/page.tsx',
  'd:/mina/front/src/app/school-admin/exams/edit/[id]/page.tsx'
];

for (const file of pagePaths) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(
    /handleAdvancedMetadataExcelChange=\{\(e\) => moduleManagement\.handleAdvancedMetadataExcelChange\(e, state\.activeSubExamIndex, source\)\}/g,
    `handleAdvancedMetadataExcelChange={async (e) => {
        const updatedList = await moduleManagement.handleAdvancedMetadataExcelChange(e, state.activeSubExamIndex, source);
        if (updatedList && updatedList.length > 0 && state.editingQuestionIndex !== null && state.showQuestionForm) {
          state.setTempQuestion(updatedList[state.editingQuestionIndex]);
        }
      }}`
  );

  content = content.replace(
    /downloadAdvancedMetadataTemplate=\{moduleManagement\.downloadAdvancedMetadataTemplate\}/g,
    `downloadAdvancedMetadataTemplate={() => moduleManagement.downloadAdvancedMetadataTemplate(state.activeSubExamIndex, source)}`
  );

  fs.writeFileSync(file, content);
}
console.log('Pages updated successfully.');
