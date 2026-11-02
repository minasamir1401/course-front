const fs = require('fs');

const filesToPatch = [
    'd:/mina/front/src/app/super-admin/exams/new/components/ModulesList.tsx',
    'd:/mina/front/src/app/super-admin/exams/edit/[id]/components/ModulesList.tsx',
    'd:/mina/front/src/app/school-admin/exams/new/components/ModulesList.tsx',
    'd:/mina/front/src/app/school-admin/exams/edit/[id]/components/ModulesList.tsx'
];

filesToPatch.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    // Find the button and remove it completely. 
    // The button looks like this:
    /*
          <button 
            onClick={openAddModuleModal}
            className="w-full mt-4 bg-white border-2 border-dashed border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 py-4 rounded-[24px] font-black text-lg transition-all flex items-center justify-center gap-2"
          >
            <Monitor className="w-5 h-5" />
            {language === 'ar' ? 'إضافة موديول جديد' : 'Add New Module'}
          </button>
    */
    
    const buttonRegex = /<button\s+onClick=\{openAddModuleModal\}[\s\S]*?<Monitor className="w-5 h-5" \/>[\s\S]*?<\/button>/;
    if (content.match(buttonRegex)) {
        content = content.replace(buttonRegex, '');
        fs.writeFileSync(file, content, 'utf8');
        console.log('Removed button in', file);
    } else {
        console.log('Button not found in', file);
    }
});
