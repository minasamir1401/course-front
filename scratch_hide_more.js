const fs = require('fs');

const files = [
    'd:/mina/front/src/app/super-admin/exams/new/page.tsx',
    'd:/mina/front/src/app/super-admin/exams/edit/[id]/page.tsx',
    'd:/mina/front/src/app/school-admin/exams/new/page.tsx',
    'd:/mina/front/src/app/school-admin/exams/edit/[id]/page.tsx'
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');

    // Remove the Title Block just in case
    content = content.replace(
        /<div className="animate-in fade-in duration-500">\s*<div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6 bg-white p-8 rounded-\[40px\] border border-slate-100 shadow-sm \$\{language === 'ar' \? 'text-right' : 'text-left'\}`}>[\s\S]*?<\/div>\s*<\/div>/g,
        ''
    );
    // Remove "Add New Module" card inside the module grid
    content = content.replace(
        /<div className="bg-white border-4 border-dashed border-slate-100 rounded-\[32px\] p-6 hover:border-indigo-500\/30 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer min-h-\[250px\]" onClick=\{openAddModuleModal\}>[\s\S]*?\{language === 'ar' \? 'إضافة موديول جديد' : 'Add New Module'\}<\/span>\s*<\/div>/g,
        ''
    );

    // Remove the remaining Standalone Questions text if not already hidden properly
    content = content.replace(
        /<h4 className="text-2xl font-black text-slate-800">\{language === 'ar' \? 'الأسئلة المستقلة' : 'Standalone Questions'\}<\/h4>/g,
        ''
    );
    
    // Also let's check for any remaining Module Structure text
    content = content.replace(
        /\{language === 'ar' \? 'هيكل الموديولات' : 'Modules Structure'\}/g,
        "''"
    );

    fs.writeFileSync(file, content, 'utf8');
}
console.log('Done cleaning up more UI text.');
