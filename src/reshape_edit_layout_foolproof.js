const fs = require('fs');

let content = fs.readFileSync('src/app/super-admin/exams/edit/[id]/page.tsx', 'utf8');

// We want to transform the DOM tree WITHOUT parsing JSX manually, just using very precise string slices.

// Find start of DashboardLayout inside return
const returnStart = content.indexOf('  return (\n    <DashboardLayout hideSidebar>');
if (returnStart === -1) {
  console.log('Return start not found (try \\r\\n)');
  process.exit(1);
}

// 1. Replace the top container + Command Center Header up to `<div className="flex flex-col gap-8">`
const flexColStart = content.indexOf('<div className="flex flex-col gap-8">', returnStart);
const beforeFlexCol = content.substring(0, flexColStart);

const newBeforeFlexCol = beforeFlexCol.replace(
  /<div\s+className={`max-w-7xl[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
  `<div
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
          {/* Modules Content goes here because we leave the flex col gap 8 open */}`
);

// 2. Remove the `<div className="flex flex-col gap-8">` itself!
// Actually, since I left `lg:col-span-8` open, everything inside `flex flex-col gap-8` will just be children of `lg:col-span-8`.
// So we can replace `<div className="flex flex-col gap-8">` with NOTHING!
// Wait! If I replace it with nothing, then there's an extra `</div>` at the end!
// The structure is:
// <div lg:col-span-8>
//   [Settings Modal Content]
//   [Questions Content Area]
// ... wait, the user wants the Settings Modal to be in `lg:col-span-4`!

// This approach is much simpler:
// Swap the text of Settings Modal and Questions Content Area, and strip the modal wrappers.

// Find Settings Modal contents (inside `<div className="space-y-6">`)
const settingsContentStart = content.indexOf('<div className="space-y-6">', flexColStart);
// Find end of Settings Modal contents (before `</div></div></div></div>)}`)
const settingsContentEnd = content.indexOf('</div>\n                </div>\n              </div>\n            </div>\n          )}', settingsContentStart) > -1 
  ? content.indexOf('</div>\n                </div>\n              </div>\n            </div>\n          )}', settingsContentStart)
  : content.indexOf('</div>\r\n                </div>\r\n              </div>\r\n            </div>\r\n          )}', settingsContentStart);

let settingsContent = content.substring(settingsContentStart, settingsContentEnd);
settingsContent = settingsContent.replace(/onClick=\{\(\) => setShowSettingsModal\(false\)\}/g, "");

// Find Questions Content Area
const questionsStart = content.indexOf('{/* Questions Content Area */}');
// Questions Content Area goes until the end of the DashboardLayout minus its closing divs.
const dashboardEnd = content.lastIndexOf('</DashboardLayout>');
// The original file ends with:
//         </div>
//       </div>
//     </DashboardLayout>
// We need to capture from Questions Content Area to the `</div>` before `</DashboardLayout>`.
let questionsContentEnd = content.lastIndexOf('</div>', dashboardEnd);
questionsContentEnd = content.lastIndexOf('</div>', questionsContentEnd - 1);
questionsContentEnd = content.lastIndexOf('</div>', questionsContentEnd - 1);
// Now questionsContentEnd points to the `</div>` closing `w-full flex flex-col gap-8`.
const questionsContent = content.substring(questionsStart, questionsContentEnd + 6);

// Assemble!
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

fs.writeFileSync('src/app/super-admin/exams/edit/[id]/page.tsx', finalOutput);
console.log('Successfully re-shaped!');
