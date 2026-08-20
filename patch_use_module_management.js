const fs = require('fs');

const filesToPatch = [
    'd:/mina/front/src/app/super-admin/exams/new/hooks/useModuleManagement.ts',
    'd:/mina/front/src/app/super-admin/exams/edit/[id]/hooks/useModuleManagement.ts',
    'd:/mina/front/src/app/school-admin/exams/new/hooks/useModuleManagement.ts',
    'd:/mina/front/src/app/school-admin/exams/edit/[id]/hooks/useModuleManagement.ts'
];

filesToPatch.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if it already returns handleExcelUpload
    if (content.includes('handleExcelUpload,')) return;

    // Replace the return statement
    content = content.replace(
        /return\s*\{\s*openAddModuleModal,\s*openEditModuleModal,\s*handleRemoveModule,\s*saveModule,\s*exportQuestionsToExcel,\s*parseQuestionsFromExcel,\s*handleMetadataExcelChange,\s*handleQuestionsExcelChange,\s*handleAssignmentsExcelChange\s*\};/,
        `return {
    openAddModuleModal, openEditModuleModal, handleRemoveModule, saveModule, exportQuestionsToExcel, parseQuestionsFromExcel, handleMetadataExcelChange, handleQuestionsExcelChange, handleAssignmentsExcelChange, handleExcelUpload, downloadMetadataTemplate
  };`
    );

    fs.writeFileSync(file, content, 'utf8');
    console.log('Patched', file);
});
