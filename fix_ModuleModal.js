const fs = require('fs');
const path = require('path');

const directories = [
  'src/app/super-admin/exams/new',
  'src/app/super-admin/exams/edit/[id]',
  'src/app/school-admin/exams/new',
  'src/app/school-admin/exams/edit/[id]'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) return;

  const uiPath = path.join(dir, 'components', 'ModuleModal.tsx');
  if (fs.existsSync(uiPath)) {
    let content = fs.readFileSync(uiPath, 'utf8');

    const replaceStr = [
      '                    }`}',
      '                  >',
      '                    <tab.icon className="w-5 h-5" />',
      '                    {tab.label}',
      '                  </button>',
      '                ))}',
      '              </div>',
      '',
      '              {/* Modal Content */}',
      '              <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/30 custom-scrollbar">',
      '                {activeTab === \\'info\\' && (',
      '                  <div className="space-y-8 animate-in fade-in duration-300">',
      '                     <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm space-y-6">',
      '                       <div className="flex items-center justify-between">',
      '                         <div className="flex-1">',
      '                           <input ',
      '                             type="text"',
      '                             value={currentModule.title}',
      '                             onChange={(e) => setCurrentModule({...currentModule, title: e.target.value})}',
      '                             placeholder={language === \\'ar\\' ? "عنوان الموديول..." : "Module Title..."}',
      '                             className="w-full text-2xl font-black text-slate-900 outline-none placeholder:text-slate-300 bg-transparent"',
      '                           />',
      '                         </div>',
      '                       </div>',
      '                     </div>',
      '',
      '                     <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm space-y-6">',
      '                       <h4 className="text-lg font-black text-slate-800 flex items-center gap-3">',
      '                          <Target className="w-6 h-6 text-indigo-600" />',
      '                          {language === \\'ar\\' ? "الأهداف والمعايير الأكاديمية" : "Academic Objectives & Standards"}',
      '                       </h4>'
    ].join('\\n');

    const regex = /                    \}`\}\n                  >\n                          <Target className="w-6 h-6 text-indigo-600" \/>\n                          \{language === 'ar' \? "الأهداف والمعايير الأكاديمية" : "Academic Objectives & Standards"\}\n                       <\/h4>/g;

    if (regex.test(content)) {
        content = content.replace(regex, replaceStr.replace(/\\n/g, '\n'));
        fs.writeFileSync(uiPath, content);
        console.log(`Updated ${uiPath}`);
    } else {
        console.log(`Failed to find syntax error in ${uiPath}`);
    }
  }
});
