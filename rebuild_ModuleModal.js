const fs = require('fs');
const path = require('path');

const missingCode = `                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={\`flex-1 py-5 flex items-center justify-center gap-3 font-black text-sm transition-all \${
                      activeTab === tab.id ? 'text-indigo-600 bg-white border-b-2 border-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                    }\`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/30 custom-scrollbar">
                {activeTab === 'info' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                     <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm space-y-6">
                       <div className="flex items-center justify-between">
                         <div className="flex-1">
                           <input 
                             type="text"
                             value={currentModule.title}
                             onChange={(e) => setCurrentModule({...currentModule, title: e.target.value})}
                             placeholder={language === 'ar' ? "عنوان الموديول..." : "Module Title..."}
                             className="w-full text-2xl font-black text-slate-900 outline-none placeholder:text-slate-300 bg-transparent"
                           />
                         </div>
                       </div>
                     </div>

                     <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm space-y-6">
                       <h4 className="text-lg font-black text-slate-800 flex items-center gap-3">
                          <Target className="w-6 h-6 text-indigo-600" />
                          {language === 'ar' ? "الأهداف والمعايير الأكاديمية" : "Academic Objectives & Standards"}
                       </h4>
                       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{language === 'ar' ? "المجال" : "Domain"}</label>
                          <select `;

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

    const searchStr = `                ].map(tab => (
                            value={currentModule.domain || ""}`;

    if (content.includes(searchStr)) {
        content = content.replace(searchStr, `                ].map(tab => (\n${missingCode}\n                            value={currentModule.domain || ""}`);
        fs.writeFileSync(uiPath, content);
        console.log(`Updated ${uiPath}`);
    } else {
        console.log(`String not matched in ${uiPath}`);
    }
  }
});
