const fs = require('fs');

function reshape(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Find the start of the return statement (DashboardLayout)
  const returnRegex = /  return \([\s\S]*?<DashboardLayout[^>]*>/;
  const returnMatch = content.match(returnRegex);
  if (!returnMatch) {
    console.log('Return start not found in ' + filePath);
    return;
  }
  
  // Find where the Command Center Header starts
  const commandCenterIndex = content.indexOf('{/* Command Center Header */}');
  const divBeforeCommandCenter = content.lastIndexOf('<div', commandCenterIndex);
  const beforeFlexCol = content.substring(0, divBeforeCommandCenter);
  
  const newBeforeFlexCol = beforeFlexCol + `
      <div
        className={\`max-w-[1600px] mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 \${language === "ar" ? "rtl" : "ltr"}\`}
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        <div className="lg:col-span-8 flex flex-col gap-8 order-2 lg:order-1">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-3 bg-slate-50 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all text-slate-600"
              >
                <ChevronLeft className="w-5 h-5 rtl:-scale-x-100" />
              </button>
              <h2 className="text-2xl font-black text-slate-800">
                {language === "ar" ? "بناء الاختبار" : "Exam Builder"}
              </h2>
            </div>
            <div className="flex gap-3">
              {lastAutoSave && (
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold px-3 py-2 bg-slate-50 rounded-xl">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {language === "ar"
                    ? \`آخر حفظ تلقائي: \${lastAutoSave.toLocaleTimeString()}\`
                    : \`Auto-saved at \${lastAutoSave.toLocaleTimeString()}\`}
                </div>
              )}
              <button
                onClick={() => handleSubmit()}
                disabled={saving}
                className="px-6 py-3 rounded-2xl font-black bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? "Saving..." : (language === 'ar' ? "حفظ التغييرات" : "Save Changes")}
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>
`;

  // Find Settings Content
  let settingsContentStart = content.indexOf('<div className="space-y-6">');
  if (settingsContentStart === -1) {
    settingsContentStart = content.indexOf('<div className="p-6 md:p-8 space-y-8">');
    if (settingsContentStart === -1) {
       console.log('Settings content start not found');
       return;
    }
  }
  
  let htmlDepth = 0;
  let actualSettingsEnd = -1;
  let inSettings = false;
  for (let i = settingsContentStart; i < content.length; i++) {
     if (content.substr(i, 4) === '<div') {
         htmlDepth++;
         inSettings = true;
     } else if (content.substr(i, 5) === '</div') {
         htmlDepth--;
         if (inSettings && htmlDepth === 0) {
             actualSettingsEnd = i + 6;
             break;
         }
     }
  }
  
  if (actualSettingsEnd === -1) {
      console.log('Could not find end of settings div');
      return;
  }
  
  let settingsContent = content.substring(settingsContentStart, actualSettingsEnd);
  settingsContent = settingsContent.replace(/onClick=\{\(\) => setShowSettingsModal\(false\)\}/g, "");
  
  // Find Questions Content Area
  const questionsStart = content.indexOf('{/* Questions Content Area */}');
  
  // Find where Questions Content Area Ends
  let qDepth = 0;
  let qStarted = false;
  let actualQEnd = -1;
  for (let i = questionsStart; i < content.length; i++) {
     if (content.substr(i, 4) === '<div') {
         qDepth++;
         qStarted = true;
     } else if (content.substr(i, 5) === '</div') {
         qDepth--;
         if (qStarted && qDepth === 0) {
             actualQEnd = i + 6;
             break;
         }
     }
  }
  
  if (actualQEnd === -1) {
      console.log('Could not find end of questions div');
      return;
  }
  
  let questionsContent = content.substring(questionsStart, actualQEnd);
  questionsContent = questionsContent.replace(/<div className="w-full flex flex-col gap-8">/, '<div className="flex flex-col gap-8">');
  
  // Find any trailing modals (like {isAddingModule && ...}) between actualQEnd and </DashboardLayout>
  const dashboardEnd = content.lastIndexOf('</DashboardLayout>');
  
  let trailingModals = content.substring(actualQEnd, dashboardEnd);
  // However, there might be closing divs for the main layout wrapper inside trailingModals that we need to remove!
  // In the original, the layout is:
  // <div className="max-w-7xl...">
  //    ...
  // </div>
  // So there is one closing `</div>` right before `</DashboardLayout>` or right after the Questions area.
  // We will just extract the modals cleanly:
  const isAddingModuleStart = trailingModals.indexOf('{isAddingModule &&');
  let cleanTrailingModals = "";
  if (isAddingModuleStart !== -1) {
     let mDepth = 0;
     let mStarted = false;
     let mEnd = -1;
     // find the matching closing brace for the {isAddingModule && ( ... )}
     let braceDepth = 0;
     for (let i = isAddingModuleStart; i < trailingModals.length; i++) {
         if (trailingModals[i] === '{') braceDepth++;
         if (trailingModals[i] === '}') {
             braceDepth--;
             if (braceDepth === 0) {
                 mEnd = i + 1;
                 break;
             }
         }
     }
     if (mEnd !== -1) {
         cleanTrailingModals = trailingModals.substring(isAddingModuleStart, mEnd);
     }
  }

  const finalOutput = newBeforeFlexCol + `
          ${questionsContent}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6 order-1 lg:order-2">
          <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm flex flex-col gap-6 sticky top-8">
            <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg border-b border-slate-50 pb-4">
               <Settings className="w-5 h-5 text-indigo-600" />
               {language === "ar" ? "الإعدادات العامة" : "General Settings"}
            </h3>
            ${settingsContent}
          </div>
        </div>
      </div>
      
      ${cleanTrailingModals}
    </DashboardLayout>
  );
}
`;

  fs.writeFileSync(filePath, finalOutput);
  console.log('Successfully reshaped ' + filePath);
}

reshape('src/app/super-admin/exams/edit/[id]/page.tsx');
// reshape('src/app/school-admin/exams/edit/[id]/page.tsx'); // already done!
