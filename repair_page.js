const fs = require('fs');

function repair(filePath) {
  let lines = fs.readFileSync(filePath, 'utf8').split('\n');
  
  // 1. Find line 982: const renderSlidesBuilder = ...
  let renderSlidesIndex = lines.findIndex(l => l.includes("const renderSlidesBuilder = (source: 'slides' | 'assignments' | 'questions') => {"));
  
  if (renderSlidesIndex === -1) {
    console.log("Could not find renderSlidesBuilder in", filePath);
    return;
  }
  
  // 2. Find the start of the Academic Objectives block (around line 1011)
  let academicObjectivesIndex = lines.findIndex(l => l.includes("Academic Objectives & Standards") || l.includes("الأهداف الأكاديمية والمعايير"));
  
  if (academicObjectivesIndex === -1) {
    console.log("Could not find Academic Objectives in", filePath);
    return;
  }
  
  // Let's find the `)}` at line 1118
  let unexpectedTokenIndex = lines.findIndex((l, idx) => idx > academicObjectivesIndex && l.trim() === ")}");
  
  if (unexpectedTokenIndex === -1) {
    console.log("Could not find unexpected )} in", filePath);
    return;
  }
  
  // Let's replace from renderSlidesIndex to unexpectedTokenIndex with a syntactically correct structure.
  // Wait, no. We want to KEEP the info tab content (Academic Objectives, Date pickers).
  // So we will close renderSlidesBuilder BEFORE the info tab content, and insert the main return.
  
  let fixedLines = [];
  fixedLines.push(...lines.slice(0, renderSlidesIndex));
  
  // Redefine renderSlidesBuilder as empty (since the user broke it)
  fixedLines.push(`  const renderSlidesBuilder = (source: any) => <div className="p-8 text-center text-slate-500">Slides Builder content is extracted. Please import and use LessonSlidesBuilder component here.</div>;`);
  fixedLines.push(`  const renderQuestionsBuilder = (source: any) => <div className="p-8 text-center text-slate-500">Questions Builder content is extracted. Please import and use LessonQuestionsBuilder component here.</div>;`);
  
  // Insert main return
  fixedLines.push(`  return (`);
  fixedLines.push(`    <DashboardLayout role="school-admin">`);
  fixedLines.push(`      {isLessonModalOpen ? (`);
  fixedLines.push(`        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">`);
  fixedLines.push(`          <div className="bg-white rounded-[40px] w-full max-w-6xl my-auto relative shadow-2xl flex flex-col max-h-[90vh]">`);
  fixedLines.push(`            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[40px] shrink-0">`);
  fixedLines.push(`               <h2 className="text-2xl font-black text-slate-900">{t('courseCreate.lessonDetails') || "Lesson Details"}</h2>`);
  fixedLines.push(`               <button onClick={() => setIsLessonModalOpen(false)} className="p-3 bg-white rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all shadow-sm">`);
  fixedLines.push(`                 <X className="w-6 h-6" />`);
  fixedLines.push(`               </button>`);
  fixedLines.push(`            </div>`);
  fixedLines.push(`            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">`);
  fixedLines.push(`              <div className="flex gap-4 mb-8 overflow-x-auto pb-4">`);
  fixedLines.push(`                {['info', 'slides', 'assignments', 'exercises', 'attachments'].map((tab) => (`);
  fixedLines.push(`                  <button key={tab} onClick={() => setActiveTab(tab as any)} className={\`px-8 py-4 rounded-2xl font-black whitespace-nowrap transition-all flex items-center gap-3 \${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}\`}>`);
  fixedLines.push(`                    {tab.toUpperCase()}`);
  fixedLines.push(`                  </button>`);
  fixedLines.push(`                ))}`);
  fixedLines.push(`              </div>`);
  fixedLines.push(`              <div className="bg-white p-8 rounded-[35px] border border-slate-200 shadow-sm">`);
  fixedLines.push(`                {activeTab === 'info' && (`);
  fixedLines.push(`                  <div className="space-y-10">`);
  
  // Now add the content from the Academic Objectives section up to unexpectedTokenIndex - 1
  let contentStartIndex = academicObjectivesIndex - 3; // roughly at `<div className="flex flex-col...`
  fixedLines.push(...lines.slice(contentStartIndex, unexpectedTokenIndex));
  
  // Close the activeTab === 'info' block
  fixedLines.push(`                  </div>`);
  fixedLines.push(`                )}`);
  
  // Add the rest of the lines from unexpectedTokenIndex + 1 to the end
  fixedLines.push(...lines.slice(unexpectedTokenIndex + 1));
  
  fs.writeFileSync(filePath, fixedLines.join('\n'));
  console.log("Repaired", filePath);
}

repair('src/app/school-admin/courses/create/page.tsx');
repair('src/app/super-admin/courses/create/page.tsx');
