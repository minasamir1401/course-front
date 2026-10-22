'use client';

import { useEffect, useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { buildAdvancedMetadataTemplateRows } from '@/lib/examExcelTemplates';
import { applyQuestionMetadataRows } from '@/lib/questionMetadataExcel';
import { useNotification } from '@/context/NotificationContext';

export default function QuestionMetadataExcelTools({ questions, scope, language, disabled = false, onChange }: {
  questions: any[]; scope: string; language: string; disabled?: boolean; onChange: (questions: any[]) => void;
}) {
  const { showToast } = useNotification();
  const file = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const latest = useRef({ questions, scope, disabled, onChange });
  useEffect(() => { latest.current = { questions, scope, disabled, onChange }; }, [questions, scope, disabled, onChange]);
  const ar = language === 'ar';
  const importMetadata = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]; event.target.value = '';
    if (!selected) return;
    const start = latest.current, snapshot = JSON.stringify(start.questions);
    try {
      const book = XLSX.read(await selected.arrayBuffer(), { type: 'array' });
      if (!mounted.current) return;
      const current = latest.current;
      if (current.disabled || current.scope !== start.scope || JSON.stringify(current.questions) !== snapshot) throw new Error(ar ? 'تغيرت القائمة أثناء قراءة الملف. أعد الاستيراد.' : 'The list changed while reading. Import again.');
      const sheet = book.Sheets.Metadata || book.Sheets[book.SheetNames[0]];
      const updated = applyQuestionMetadataRows(XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }), current.questions);
      current.onChange(updated);
      showToast(ar ? 'تم تطبيق الميتا داتا. احفظ الدرس لتثبيت التغييرات.' : 'Metadata applied. Save the lesson to keep the changes.', 'success');
    } catch (error) { showToast(error instanceof Error ? error.message : String(error), 'error'); }
  };
  const download = () => {
    try {
      const rows = buildAdvancedMetadataTemplateRows(language, questions);
      const sheet = XLSX.utils.aoa_to_sheet(questions.length ? rows : rows.slice(0, 1));
      sheet['!cols'] = rows[0].map(() => ({ wch: 32 }));
      const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, 'Metadata');
      XLSX.writeFile(book, 'question_metadata.xlsx');
    } catch (error) { showToast(error instanceof Error ? error.message : String(error), 'error'); }
  };
  const buttonStyle = 'bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 px-5 py-2.5 rounded-xl font-black flex items-center gap-2 text-xs disabled:opacity-50';
  return <>
    <input ref={file} type="file" accept=".xlsx,.xls,.csv" hidden onChange={event => void importMetadata(event)} />
    <button type="button" className={buttonStyle} disabled={disabled} onClick={download}><Download size={16}/>{ar ? 'نموذج الميتا داتا' : 'Metadata template'}</button>
    <button type="button" className={buttonStyle} disabled={disabled || !questions.length} onClick={() => file.current?.click()}><Upload size={16}/>{ar ? 'استيراد الميتا داتا' : 'Import metadata'}</button>
  </>;
}
