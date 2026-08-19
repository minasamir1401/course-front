const fs = require('fs');

const files = [
    'd:/mina/front/src/app/super-admin/exams/new/page.tsx',
    'd:/mina/front/src/app/super-admin/exams/edit/[id]/page.tsx',
    'd:/mina/front/src/app/school-admin/exams/new/page.tsx',
    'd:/mina/front/src/app/school-admin/exams/edit/[id]/page.tsx'
];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Remove Page Header (Create Educational Course)
    content = content.replace(
        /<div className="mb-10">\s*<h1 className="text-3xl md:text-4xl font-black text-slate-900">\{t\('courseCreate\.title'\)\}<\/h1>\s*<p className="text-slate-500 mt-2 text-lg">\{t\('courseCreate\.subtitle'\)\}<\/p>\s*<\/div>/g,
        ''
    );

    // 2. Hide Modules Structure header
    content = content.replace(
        /<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">\s*<div>\s*<h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">\s*<Layers className="w-8 h-8 text-indigo-600" \/>\s*\{language === 'ar' \? 'هيكل الموديولات' : 'Modules Structure'\}\s*<\/h3>\s*<p className="text-slate-500 mt-2">\s*\{language === 'ar' \? 'قم ببناء هيكل الكورس من خلال إضافة موديولات ودروس\.' : 'Build the course structure by adding modules and lessons\.'\}\s*<\/p>\s*<\/div>[\s\S]*?<\/div>/g,
        ''
    );

    // 3. Hide Standalone Questions header
    content = content.replace(
        /<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">\s*<div>\s*<h4 className="text-2xl font-black text-slate-800">\{language === 'ar' \? 'الأسئلة المستقلة' : 'Standalone Questions'\}<\/h4>\s*<p className="text-slate-500 mt-2">\s*\{language === 'ar' \? 'أسئلة إضافية للتقييم خارج الموديولات' : 'Additional questions for assessment outside modules'\}\s*<\/p>\s*<\/div>[\s\S]*?<\/div>/g,
        ''
    );

    // 4. Also hide the inline Standalone Questions text if there's any
    content = content.replace(
        /<h4 className="text-2xl font-black text-slate-800">\{language === 'ar' \? 'الأسئلة المستقلة' : 'Standalone Questions'\}<\/h4>/g,
        ''
    );

    fs.writeFileSync(file, content, 'utf8');
}
console.log('UI elements hidden successfully.');
