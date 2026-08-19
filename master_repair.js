const fs = require('fs');

function repairFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');
  
  let renderSlidesIndex = lines.findIndex(l => l.includes("const renderSlidesBuilder = "));
  if (renderSlidesIndex === -1) {
    console.log("Could not find renderSlidesBuilder in", filePath);
    return;
  }
  
  // Find where activeTab === 'attachments' starts
  let endOfTabsIndex = lines.findIndex((l, i) => i > renderSlidesIndex && l.includes("activeTab === 'attachments'"));
  if (endOfTabsIndex === -1) {
    console.log("Could not find attachments tab in", filePath);
    return;
  }
  
  // Find the end of attachments tab. The attachments tab ends right before `) : (`
  let endOfModalIndex = lines.findIndex((l, i) => i > endOfTabsIndex && l.includes(") : ("));
  if (endOfModalIndex === -1) {
    console.log("Could not find ) : ( in", filePath);
    return;
  }
  
  // Actually, wait! The user's original file also has broken `{activeTab === 'info'}`?
  // Let's replace the ENTIRE `bg-white p-8 rounded-[35px]` div contents!
  let bgWhiteIndex = lines.findIndex(l => l.includes('className="bg-white p-8 rounded-[35px] border border-slate-200 shadow-sm"'));
  if (bgWhiteIndex === -1) {
    console.log("Could not find bg-white container");
    return;
  }
  
  // The modal footer starts with `{/* Modal Footer */}`
  let footerIndex = lines.findIndex(l => l.includes('{/* Modal Footer */}'));
  if (footerIndex === -1) {
    footerIndex = lines.findIndex(l => l.includes('courseCreate.cancelChanges') || l.includes('Cancel Changes'));
    if (footerIndex !== -1) footerIndex -= 2; // back up to the div
  }
  
  if (footerIndex === -1 || bgWhiteIndex === -1) {
    console.log("Could not find boundaries");
    return;
  }
  
  let beforeLines = lines.slice(0, bgWhiteIndex + 1);
  let afterLines = lines.slice(footerIndex);
  
  // Ensure imports exist
  let hasImports = beforeLines.some(l => l.includes('LessonInfoTab'));
  if (!hasImports) {
    let importIndex = beforeLines.findIndex(l => l.includes('import DashboardLayout'));
    beforeLines.splice(importIndex + 1, 0, 
      `import { LessonInfoTab } from "@/components/course-editor/lesson-builder/LessonInfoTab";`,
      `import { LessonSlidesBuilder } from "@/components/course-editor/lesson-builder/LessonSlidesBuilder";`,
      `import { LessonQuestionsBuilder } from "@/components/course-editor/lesson-builder/LessonQuestionsBuilder";`,
      `import { LessonAttachmentsTab } from "@/components/course-editor/lesson-builder/LessonAttachmentsTab";`
    );
  } else {
    // Make sure attachments tab is imported
    let hasAttachmentsImport = beforeLines.some(l => l.includes('LessonAttachmentsTab'));
    if (!hasAttachmentsImport) {
      let importIndex = beforeLines.findIndex(l => l.includes('import { LessonInfoTab }'));
      beforeLines.splice(importIndex + 1, 0, 
        `import { LessonAttachmentsTab } from "@/components/course-editor/lesson-builder/LessonAttachmentsTab";`
      );
    }
  }
  
  let replacement = [
    `                {activeTab === 'info' && (`,
    `                   <LessonInfoTab currentLesson={currentLesson} setCurrentLesson={setCurrentLesson} language={language} showToast={showToast} metadataExcelRef={metadataExcelRef} handleExcelUpload={handleExcelUpload} />`,
    `                )}`,
    `                {activeTab === 'slides' && (`,
    `                   <LessonSlidesBuilder source="slides" currentLesson={currentLesson} setCurrentLesson={setCurrentLesson} language={language} assignmentsExcelRef={assignmentsExcelRef} questionsExcelRef={questionsExcelRef} handleAssignmentsExcelChange={handleAssignmentsExcelChange} handleQuestionsExcelChange={handleQuestionsExcelChange} handleExcelUpload={handleExcelUpload} downloadQuestionsTemplate={downloadQuestionsTemplate} />`,
    `                )}`,
    `                {activeTab === 'assignments' && (`,
    `                   <LessonQuestionsBuilder source="assignments" currentLesson={currentLesson} setCurrentLesson={setCurrentLesson} language={language} assignmentsExcelRef={assignmentsExcelRef} questionsExcelRef={questionsExcelRef} handleAssignmentsExcelChange={handleAssignmentsExcelChange} handleQuestionsExcelChange={handleQuestionsExcelChange} handleExcelUpload={handleExcelUpload} downloadQuestionsTemplate={downloadQuestionsTemplate} showQuestionForm={showQuestionForm} setShowQuestionForm={setShowQuestionForm} editingQuestionIndex={editingQuestionIndex} setEditingQuestionIndex={setEditingQuestionIndex} tempQuestion={tempQuestion} setTempQuestion={setTempQuestion} openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} />`,
    `                )}`,
    `                {activeTab === 'exercises' && (`,
    `                   <LessonQuestionsBuilder source="questions" currentLesson={currentLesson} setCurrentLesson={setCurrentLesson} language={language} assignmentsExcelRef={assignmentsExcelRef} questionsExcelRef={questionsExcelRef} handleAssignmentsExcelChange={handleAssignmentsExcelChange} handleQuestionsExcelChange={handleQuestionsExcelChange} handleExcelUpload={handleExcelUpload} downloadQuestionsTemplate={downloadQuestionsTemplate} showQuestionForm={showQuestionForm} setShowQuestionForm={setShowQuestionForm} editingQuestionIndex={editingQuestionIndex} setEditingQuestionIndex={setEditingQuestionIndex} tempQuestion={tempQuestion} setTempQuestion={setTempQuestion} openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} />`,
    `                )}`,
    `                {activeTab === 'attachments' && (`,
    `                   <LessonAttachmentsTab currentLesson={currentLesson} setCurrentLesson={setCurrentLesson} language={language} showToast={showToast} />`,
    `                )}`,
    `              </div>`, // closes bg-white p-8 rounded-[35px] container
    `            </div>` // closes flex-1 overflow-y-auto
  ];
  
  let newContent = beforeLines.concat(replacement, afterLines).join('\n');
  fs.writeFileSync(filePath, newContent);
  console.log("Repaired tabs in", filePath);
}

repairFile('src/app/school-admin/courses/create/page.tsx');
repairFile('src/app/super-admin/courses/create/page.tsx');
