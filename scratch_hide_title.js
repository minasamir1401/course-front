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

    // Remove Title block
    content = content.replace(
        /<div>\s*<h1 className="text-3xl md:text-4xl font-black text-slate-900">\{t\('courseCreate\.title'\)\}<\/h1>\s*<p className="text-slate-400 text-lg mt-1 font-bold">\{t\('courseCreate\.subtitle'\)\}<\/p>\s*<\/div>/g,
        ''
    );

    // Remove Save & Publish Button ? Wait, the user said "حفظ ونشر التقييم" is in the text they pasted. Do they want to remove it too? "الاساله الموجوده متختفيش بس اليختفي النص والزراير وشرح دول". "شرح دول" refers to "Create Educational Course", "Module Structure", "Standalone Questions". But I think I should NOT remove the save button!

    fs.writeFileSync(file, content, 'utf8');
}
console.log('Title removed successfully.');
