const fs = require('fs');
const file = 'src/app/super-admin/exams/edit/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
`        <div className="h-[70vh] flex flex-col items-center justify-center gap-6 text-slate-400">
          <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-black text-2xl animate-pulse">جاري التحميل...</p>
        </div>
      </div>
    }>`,
`        <div className="h-[70vh] flex flex-col items-center justify-center gap-6 text-slate-400">
          <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-black text-2xl animate-pulse">جاري التحميل...</p>
        </div>
      </DashboardLayout>
    }>`
);

fs.writeFileSync(file, content);
console.log('Fixed line 41 error!');
