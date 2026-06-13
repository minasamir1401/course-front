const fs = require('fs');

const files = [
  'src/app/school-admin/courses/create/page.tsx',
  'src/app/school-admin/exams/new/page.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let c = fs.readFileSync(file, 'utf-8');
    c = c.replace(/bg-white\/5 px-4 py-2 rounded-2xl border border-white\/10/g, 'bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200');
    c = c.replace(/text-sm font-bold text-white/g, 'text-sm font-bold text-slate-700');
    c = c.replace(/bg-white\/20 peer-focus:outline-none rounded-full/g, 'bg-slate-200 peer-focus:outline-none rounded-full');
    c = c.replace(/text-white\/70 bg-white\/5 px-3 py-2 rounded-xl border border-white\/10/g, 'text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200');
    c = c.replace(/text-white\/70/g, 'text-slate-500');
    c = c.replace(/bg-white\/5/g, 'bg-slate-50');
    c = c.replace(/border-white\/10/g, 'border-slate-200');
    fs.writeFileSync(file, c);
    console.log('Fixed', file);
  }
});
