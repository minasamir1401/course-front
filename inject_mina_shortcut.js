const fs = require('fs');
const path = require('path');

const files = [
  'src/app/super-admin/exams/edit/[id]/page.tsx',
  'src/app/school-admin/exams/edit/[id]/page.tsx'
];

for (const relPath of files) {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, 'utf8');

  // Insert states and useEffect
  const stateInjectionStr = `
  // MINA SHORTCUT STATES
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [duplicateQuestions, setDuplicateQuestions] = useState<any[]>([]);

  useEffect(() => {
    let keyBuffer = '';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && ((e.target as any).tagName === 'INPUT' || (e.target as any).tagName === 'TEXTAREA' || (e.target as any).isContentEditable)) {
        return;
      }
      keyBuffer += e.key.toLowerCase();
      if (keyBuffer.length > 4) {
        keyBuffer = keyBuffer.slice(-4);
      }
      if (keyBuffer === 'mina') {
        const seen = new Set();
        const dups: any[] = [];
        standaloneQuestions.forEach((q: any) => {
          const sig = (q.text || '').replace(/<[^>]*>?/gm, '').trim().toLowerCase();
          if (seen.has(sig)) {
            dups.push(q);
          } else {
            seen.add(sig);
          }
        });
        setDuplicateQuestions(dups);
        setShowDuplicatesModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [standaloneQuestions]);

  const removeMinaDuplicates = () => {
    const seen = new Set();
    const unique: any[] = [];
    standaloneQuestions.forEach((q: any) => {
      const sig = (q.text || '').replace(/<[^>]*>?/gm, '').trim().toLowerCase();
      if (!seen.has(sig)) {
        unique.push(q);
        seen.add(sig);
      }
    });
    setStandaloneQuestions(unique);
    setShowDuplicatesModal(false);
    showToast(language === 'ar' ? 'تم حذف الأسئلة المتكررة بنجاح' : 'Duplicate questions removed successfully', 'success');
  };
  // END MINA SHORTCUT
`;

  if (!content.includes('removeMinaDuplicates')) {
    content = content.replace(
      'const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);',
      'const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);\n' + stateInjectionStr
    );
  }

  // Insert modal
  const modalInjectionStr = `
      {/* Mina Duplicates Modal */}
      {showDuplicatesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl relative">
            <button
              onClick={() => setShowDuplicatesModal(false)}
              className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-100">
                <Trash2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800">{language === 'ar' ? 'أداة تنظيف المتكرر (MINA)' : 'Deduplication Tool (MINA)'}</h3>
                <p className="text-slate-500 font-bold mt-1">
                  {language === 'ar' 
                    ? \`تم العثور على \${duplicateQuestions.length} سؤال متكرر في هذا الامتحان.\` 
                    : \`Found \${duplicateQuestions.length} duplicate questions in this exam.\`}
                </p>
              </div>
            </div>
            
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 max-h-[300px] overflow-y-auto mb-8">
              {duplicateQuestions.length === 0 ? (
                <div className="text-center text-slate-400 font-bold py-8">
                  {language === 'ar' ? 'لا يوجد أسئلة متكررة!' : 'No duplicate questions found!'}
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {duplicateQuestions.map((q, i) => (
                    <li key={i} className="text-sm font-bold text-slate-600 bg-white p-3 rounded-xl border border-slate-100 line-clamp-2" dangerouslySetInnerHTML={{ __html: q.text }} />
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDuplicatesModal(false)}
                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={removeMinaDuplicates}
                disabled={duplicateQuestions.length === 0}
                className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                {language === 'ar' ? 'حذف المتكرر نهائياً' : 'Delete Duplicates Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  `;

  if (!content.includes('Mina Duplicates Modal')) {
    const splitArr = content.split('</DashboardLayout>');
    // Insert before the LAST </DashboardLayout>
    if (splitArr.length > 1) {
      const parts = [...splitArr];
      const last = parts.pop();
      content = parts.join('</DashboardLayout>') + modalInjectionStr + last;
    }
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated ${relPath} with MINA shortcut`);
}
