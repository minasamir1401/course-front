const fs = require('fs');

function reshapePerfect(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Replace the wrapper and Command Center
  const searchStart = content.indexOf('<DashboardLayout hideSidebar>');
  const actualStart = content.indexOf('<DashboardLayout hideSidebar>', searchStart + 100);
  
  const endOfCommandCenter = content.indexOf('<div className="flex flex-col gap-8">', actualStart);
  if (endOfCommandCenter === -1) {
    console.log("Could not find end of command center");
    return;
  }
  
  const headerReplacement = `
    <DashboardLayout hideSidebar>
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
  content = content.substring(0, actualStart) + headerReplacement + content.substring(endOfCommandCenter + '<div className="flex flex-col gap-8">'.length);

  // 2. Extract Settings Modal
  const settingsStart = content.indexOf('{showSettingsModal && (');
  let settingsBodyStart = content.indexOf('<div className="space-y-6">', settingsStart);
  if (settingsBodyStart === -1) {
     settingsBodyStart = content.indexOf('<div className="p-6 md:p-8 space-y-8">', settingsStart);
  }
  const settingsBodyEnd = content.indexOf('{/* Modal Footer */}', settingsStart);
  
  let settingsContent = content.substring(settingsBodyStart, settingsBodyEnd);
  settingsContent = settingsContent.replace(/onClick=\{\(\) => setShowSettingsModal\(false\)\}/g, "");
  
  const questionsArea = content.indexOf('{/* Questions Content Area */}');
  
  content = content.substring(0, settingsStart) + content.substring(questionsArea);
  
  // 3. Close the left side and inject the right side!
  const qfFormModal = content.indexOf('{/* Question Form Modal */}');
  if (qfFormModal === -1) {
      console.log('Could not find Question Form Modal');
      return;
  }
  
  let pos = qfFormModal;
  
  let divsFound = 0;
  while (divsFound < 3) {
      pos = content.lastIndexOf('</div>', pos - 1);
      divsFound++;
  }
  
  // We want to insert right AFTER the 3rd </div>!
  // So pos + 6
  const insertPos = pos + 6;
  
  const sideBarHtml = `
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
`;

  content = content.substring(0, insertPos) + sideBarHtml + content.substring(insertPos);
  content = content.replace('<div className="w-full flex flex-col gap-8">', '<div className="flex flex-col gap-8">');

  fs.writeFileSync(filePath, content);
  console.log("Successfully reshaped " + filePath);
}

reshapePerfect('src/app/super-admin/exams/edit/[id]/page.tsx');
reshapePerfect('src/app/school-admin/exams/edit/[id]/page.tsx');
