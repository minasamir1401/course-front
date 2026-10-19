"use client";
import React, { useState } from 'react';
import { Languages } from 'lucide-react';
import { translateBatch } from '@/lib/translationService';
import { questionMetadataFields } from '@/lib/bilingualMetadata';
const names: Record<string, string> = { course: 'الاختبار', section: 'القسم', domain: 'المجال', standard: 'المعيار', standards: 'المعايير', learningOutcome: 'ناتج التعلم', learningOutcomes: 'نواتج التعلم', indicator: 'المؤشر', indicators: 'المؤشرات', skill: 'المهارة', subskill: 'المهارة الفرعية', microSkill: 'المهارة الدقيقة', errorPattern: 'نمط الخطأ' };
export default function BilingualMetadataEditor({ value, onChange, fields = questionMetadataFields, language }: { value: any; onChange: (patch: Record<string, string>) => void; fields?: readonly string[]; language: string }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function fillMissing(from: 'ar' | 'en') {
    setBusy(true); setError('');
    try {
      const englishOnly = (text: string) => /[a-z]/i.test(text || '') && !/[\u0600-\u06ff]/.test(text || '');
      const sourceValue = (field: string) => from === 'ar' ? value[field] : value[field + 'En'] || (englishOnly(value[field]) ? value[field] : '');
      const missing = fields.filter(field => (from === 'ar' ? !value[field + 'En'] : !value[field] || englishOnly(value[field])) && sourceValue(field));
      const source = missing.map(sourceValue);
      const result = await translateBatch(source, from, from === 'ar' ? 'en' : 'ar', 'all');
      const patch: Record<string, string> = {};
      missing.forEach((field, i) => { if (result[i] && result[i] !== source[i]) {
        if (from === 'en' && !value[field + 'En']) patch[field + 'En'] = source[i];
        patch[field + (from === 'ar' ? 'En' : '')] = result[i];
      } });
      onChange(patch);
      if (source.length && missing.some(field => !patch[field + (from === 'ar' ? 'En' : '')])) setError(language === 'ar' ? 'تعذرت ترجمة بعض الخانات؛ يمكنك استكمالها يدويًا.' : 'Some fields could not be translated. You can fill them manually.');
    } catch { setError(language === 'ar' ? 'تعذرت الترجمة. البيانات الأصلية محفوظة.' : 'Translation failed. Original values are preserved.'); }
    finally { setBusy(false); }
  }
  return <details className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm"><summary className="cursor-pointer font-bold text-sm text-indigo-700">{language === 'ar' ? 'Metadata بالعربية والإنجليزية' : 'Arabic and English metadata'}</summary>
    <div className="flex flex-wrap gap-2 my-4">{(['ar', 'en'] as const).map(from => <button type="button" key={from} disabled={busy} onClick={() => fillMissing(from)} className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2 font-bold text-xs text-indigo-700 shadow-sm hover:bg-indigo-100 disabled:opacity-50"><Languages size={14} />{busy ? '…' : from === 'ar' ? 'العربية → English' : 'English → العربية'}</button>)}</div>
    {error && <p role="status" className="text-amber-800 text-xs mb-3">{error}</p>}
    <div className="grid sm:grid-cols-2 gap-3">{fields.map(field => <React.Fragment key={field}>{(['ar', 'en'] as const).map(lang => <label key={lang} className="text-xs font-bold text-slate-600">{lang === 'ar' ? names[field] || field : field} ({lang === 'ar' ? 'العربية' : 'English'})<textarea rows={2} dir={lang === 'ar' ? 'rtl' : 'ltr'} className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none focus:border-indigo-500" value={value?.[field + (lang === 'en' ? 'En' : '')] || ''} onChange={event => onChange({ [field + (lang === 'en' ? 'En' : '')]: event.target.value })} /></label>)}</React.Fragment>)}</div>
  </details>;
}
