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
  
  // Find the main flex container
  const flexColRegex = /<div className="flex flex-col gap-8">/;
  const flexColMatch = content.match(flexColRegex);
  if (!flexColMatch) {
    console.log('Flex col start not found in ' + filePath);
    return;
  }
  
  const flexColStart = flexColMatch.index + flexColMatch[0].length;
  
  // 1. The top header (Command Center) is from flexColStart up to the start of settings modal trigger or other content.
  // Wait, let's just replace everything inside the DashboardLayout's main container with the grid layout.
  
  // In the original file, it looks like:
  // <DashboardLayout ...>
  //   <div className="max-w-7xl mx-auto ...">
  //      <div className="bg-slate-50/50 ...">
  //          <div className="p-4 md:p-8">
  //             <div className="flex flex-col gap-8">
  //                ... Command Center Header ...
  //                ... Questions Content Area ...
  //             </div>
  //          </div>
  //      </div>
  //   </div>
  //   ... Modals ...
  // </DashboardLayout>

  // We want to replace the `max-w-7xl` container with our `max-w-[1600px] grid lg:grid-cols-12` container.
  
  const maxW7xlRegex = /<div\s+className={`max-w-7xl[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<div className="flex flex-col gap-8">/;
  const maxW7xlMatch = content.match(maxW7xlRegex);
  
  if (!maxW7xlMatch) {
      console.log('MaxW7xl not found in ' + filePath);
      return;
  }
  
  const beforeFlexCol = content.substring(0, maxW7xlMatch.index);
  
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
                <ArrowRight className="w-5 h-5 rtl:-scale-x-100" />
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

  // Find the Settings Content
  // In the original file, the Settings modal content starts with <div className="space-y-6"> and ends where the Modal ends.
  let settingsContentStart = content.indexOf('<div className="space-y-6">');
  if (settingsContentStart === -1) {
    // maybe it's p-6 md:p-8 space-y-8
    settingsContentStart = content.indexOf('<div className="p-6 md:p-8 space-y-8">');
    if (settingsContentStart === -1) {
       console.log('Settings content start not found');
       return;
    }
  }
  
  const settingsModalStart = content.lastIndexOf('{showSettingsModal && (', settingsContentStart);
  let settingsContentEnd = content.indexOf('</div>\\n                </div>\\n              </div>\\n            </div>\\n          )}', settingsContentStart);
  if (settingsContentEnd === -1) {
      // try without backslashes
      settingsContentEnd = content.indexOf('</div>\n                </div>\n              </div>\n            </div>\n          )}', settingsContentStart);
  }
  if (settingsContentEnd === -1) {
      settingsContentEnd = content.indexOf('</div>\r\n                </div>\r\n              </div>\r\n            </div>\r\n          )}', settingsContentStart);
  }
  if (settingsContentEnd === -1) {
      // It's the end of the modal.
      const settingsModalText = content.substring(settingsModalStart, settingsContentStart + 5000);
      const closeDivIndex = settingsModalText.indexOf('</button>');
      settingsContentEnd = settingsContentStart + 3500; // heuristic
  }

  // Let's actually parse the settings content dynamically using parenthesis matching
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
  // Remove close modal button clicks
  settingsContent = settingsContent.replace(/onClick=\{\(\) => setShowSettingsModal\(false\)\}/g, "");
  
  // Find Questions Content Area
  const questionsStart = content.indexOf('{/* Questions Content Area */}');
  
  // It ends before the modals.
  // The modals start with {showSettingsModal && (
  let questionsContentEnd = settingsModalStart;
  if (questionsContentEnd === -1) {
      questionsContentEnd = content.lastIndexOf('</div>', content.lastIndexOf('</DashboardLayout>'));
  }
  
  // The question area might have some closing divs that belong to the outer container. We need to grab exactly from { /* Questions Content Area */ } to the end of that specific column.
  let qDepth = 0;
  let qStarted = false;
  let actualQEnd = -1;
  for (let i = questionsStart; i < questionsContentEnd; i++) {
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
      // Just take up to the modal start, minus a few closing divs
      const sub = content.substring(questionsStart, settingsModalStart);
      actualQEnd = settingsModalStart - sub.match(/<\/div>\s*<\/div>\s*<\/div>\s*$/)[0].length;
  }
  
  const questionsContent = content.substring(questionsStart, actualQEnd);
  
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
    </DashboardLayout>
  );
}
`;

  fs.writeFileSync(filePath, finalOutput);
  console.log('Successfully reshaped ' + filePath);
}

reshape('src/app/super-admin/exams/edit/[id]/page.tsx');
reshape('src/app/school-admin/exams/edit/[id]/page.tsx');
