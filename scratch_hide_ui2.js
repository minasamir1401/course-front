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

    // Remove Top Title Block completely if it's there
    content = content.replace(
        /<div className="mb-12">\s*<h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">\{t\('courseCreate\.title'\)\}<\/h1>\s*<p className="text-slate-500 text-xl max-w-2xl font-medium leading-relaxed">\{t\('courseCreate\.subtitle'\)\}<\/p>\s*<\/div>/g,
        ''
    );
    content = content.replace(
        /<div className="mb-10">\s*<h1 className="text-3xl md:text-4xl font-black text-slate-900">\{t\('courseCreate\.title'\)\}<\/h1>\s*<p className="text-slate-500 mt-2 text-lg">\{t\('courseCreate\.subtitle'\)\}<\/p>\s*<\/div>/g,
        ''
    );
    // There are some new stylings, so we can replace by regex:
    content = content.replace(
        /<div className="mb-1[02]">[\s\S]*?\{t\('courseCreate\.title'\)\}?[\s\S]*?\{t\('courseCreate\.subtitle'\)\}?[\s\S]*?<\/div>/g,
        ''
    );


    // Remove Modules Structure Header block
    content = content.replace(
        /<div className="flex justify-between items-center bg-white p-8 rounded-\[40px\] border border-slate-100 shadow-sm">[\s\S]*?\{language === 'ar' \? 'هيكل الموديولات' : 'Modules Structure'\}[\s\S]*?<\/div>/g,
        ''
    );
    // Also remove the "No modules added yet" block
    content = content.replace(
        /\{modules\.length === 0 \? \([\s\S]*?\{language === 'ar' \? 'إنشاء موديول' : 'Create Module'\}[\s\S]*?<\/button>\s*<\/div>\s*\) : \(/g,
        '{modules.length === 0 ? null : ('
    );

    // Remove Standalone Questions header
    content = content.replace(
        /<div className="bg-white p-8 rounded-\[40px\] border border-slate-100 shadow-sm mb-8 flex justify-between items-center">[\s\S]*?\{language === 'ar' \? 'الأسئلة المستقلة' : 'Standalone Questions'\}[\s\S]*?<\/div>/g,
        ''
    );

    fs.writeFileSync(file, content, 'utf8');
}
console.log('UI elements hidden successfully.');
