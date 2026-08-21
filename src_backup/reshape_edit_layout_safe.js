const fs = require('fs');

const content = fs.readFileSync('src/app/super-admin/exams/edit/[id]/page.tsx', 'utf8');

const returnRegex = /  return \([\s\S]*?<DashboardLayout hideSidebar>/;
const returnMatch = content.match(returnRegex);
const returnStart = returnMatch.index;

const settingsModalStart = content.indexOf('{/* Settings Modal */}');
const questionsContentStart = content.indexOf('{/* Questions Content Area */}');

const beforeReturn = content.substring(0, returnStart);

const settingsContentStart = content.indexOf('<div className="space-y-6">', settingsModalStart);
const settingsContentEndMatch = content.indexOf('</div>\n                </div>\n              </div>\n            </div>\n          )}', settingsContentStart);
const settingsContentEnd = settingsContentEndMatch > -1 ? settingsContentEndMatch : content.indexOf('</div>\r\n                </div>\r\n              </div>\r\n            </div>\r\n          )}', settingsContentStart);

let settingsContent = content.substring(settingsContentStart, settingsContentEnd);
settingsContent = settingsContent.replace(/onClick=\{\(\) => setShowSettingsModal\(false\)\}/g, "");

// Extract Modules Content
const modulesStart = questionsContentStart;
// Find the exact end of the modules block
// The modules block is inside `<div className="w-full flex flex-col gap-8">`
// We want to find the corresponding `</div>` that closes it.
let modulesContent = "";
let divCount = 0;
let i = modulesStart;
let started = false;

while (i < content.length) {
    if (content.substr(i, 4) === '<div') {
        divCount++;
        started = true;
    }
    if (content.substr(i, 5) === '</div') {
        divCount--;
    }
    i++;
    if (started && divCount === 0) {
        modulesContent = content.substring(modulesStart, i + 5); // include </div>
        break;
    }
}

const newReturn = `  return (
    <DashboardLayout hideSidebar>
      <div
        className={\`max-w-[1600px] mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 \${language === "ar" ? "rtl" : "ltr"}\`}
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        {/* Main Content (Modules Builder) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-3 bg-slate-50 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all text-slate-600"
              >
                <ChevronLeft className="w-5 h-5" />
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
          
          ${modulesContent}
        </div>
        <div className="lg:col-span-4 flex flex-col gap-6">
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

fs.writeFileSync('src/app/super-admin/exams/edit/[id]/page.tsx', beforeReturn + newReturn);
console.log('Successfully updated page.tsx with 4/8 column layout');
