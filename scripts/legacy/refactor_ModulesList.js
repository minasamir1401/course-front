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

  const uiPath = path.join(dir, 'components', 'ModulesList.tsx');
  if (fs.existsSync(uiPath)) {
    let content = fs.readFileSync(uiPath, 'utf8');

    // 1. Change question count to subExams count
    const qCountStr = `{language === 'ar' ? \`\${lesson.questions?.length || 0} أسئلة\` : \`\${lesson.questions?.length || 0} Questions\`}`;
    const newCountStr = `{language === 'ar' ? \`\${lesson.subExams?.length || 0} اختبارات\` : \`\${lesson.subExams?.length || 0} Exams\`}`;
    
    if (content.includes(qCountStr)) {
        content = content.replace(qCountStr, newCountStr);
    }
    
    // Also change the icon color check
    const iconCheckStr = `lesson.questions?.length ? 'text-indigo-600' : 'text-slate-300'`;
    const newIconCheckStr = `lesson.subExams?.length ? 'text-indigo-600' : 'text-slate-300'`;
    if (content.includes(iconCheckStr)) {
        content = content.replace(iconCheckStr, newIconCheckStr);
    }

    // 2. Add "Add New Module" button at the bottom if modules.length > 0
    const endListStr = `        </div>
      )}
    </div>`;
    
    const newEndListStr = `          
          <button 
            onClick={openAddModuleModal}
            className="w-full mt-4 bg-white border-2 border-dashed border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 py-4 rounded-[24px] font-black text-lg transition-all flex items-center justify-center gap-2"
          >
            <Monitor className="w-5 h-5" />
            {language === 'ar' ? 'إضافة موديول جديد' : 'Add New Module'}
          </button>
        </div>
      )}
    </div>`;

    if (content.includes(endListStr) && !content.includes('إضافة موديول جديد')) {
        content = content.replace(endListStr, newEndListStr);
    }

    fs.writeFileSync(uiPath, content);
    console.log(`Updated ${uiPath}`);
  }
});
