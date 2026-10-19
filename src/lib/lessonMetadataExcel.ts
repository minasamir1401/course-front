const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/[()_\-]/g, ' ').replace(/\s+/g, ' ');
export function metadataColumn(headers: unknown[], field: string, english: boolean): number {
  const aliases: Record<string, string[]> = {
    domain: ['domain', 'المجال'], standards: ['standard', 'المعيار', 'المعايير'], indicators: ['indicator', 'المؤشر', 'المؤشرات'],
    learningOutcomes: ['outcome', 'ناتج', 'نواتج', 'النواتج', 'مخرج', 'المخرجات'], lesson: ['lesson', 'عنوان الدرس'],
    skill: ['skill', 'المهارة'], subskill: ['subskill', 'sub skill', 'المهارة الفرعية'], microSkill: ['micro skill', 'microskill', 'المهارة الدقيقة'], errorPattern: ['errorpattern', 'error pattern', 'نمط الخطأ'], course: ['exam', 'course', 'الاختبار'], section: ['section', 'القسم'],
  };
  return headers.findIndex(raw => {
    const h = normalize(raw), en = /\ben\b|\benglish\b|إنجل|انجل/.test(h);
    const correct = (aliases[field] || [field]).some(a => h.includes(a));
    if (field === 'skill' && /sub\s?skill|micro\s?skill|فرعية|دقيقة/.test(h)) return false;
    return correct && en === english;
  });
}
export function parseLessonMetadataRows(rows: unknown[][], title = ''): Record<string, string> {
  const headers = rows[0] || [];
  if (!['domain', 'standards', 'indicators', 'learningOutcomes'].some(field => metadataColumn(headers, field, false) >= 0 || metadataColumn(headers, field, true) >= 0)) throw new Error('لم يتم العثور على أعمدة Metadata / No metadata columns found');
  const data = rows.slice(1).filter(row => row.some(value => String(value ?? '').trim()));
  const titleColumns = [metadataColumn(headers, 'lesson', false), metadataColumn(headers, 'lesson', true)].filter(i => i >= 0);
  const matching = title ? data.filter(row => titleColumns.some(i => normalize(row[i]) === normalize(title))) : [];
  if (title && titleColumns.length && !matching.length && data.some(row => titleColumns.some(i => String(row[i] ?? '').trim()))) throw new Error('لا توجد بيانات لهذا الدرس / No metadata matches this lesson');
  const result: Record<string, string> = {};
  for (const field of ['domain', 'standards', 'indicators', 'learningOutcomes']) for (const en of [false, true]) {
    const i = metadataColumn(headers, field, en);
    if (i < 0) continue;
    const values = [...new Set((matching.length ? matching : data).map(row => String(row[i] ?? '').trim()).filter(Boolean))];
    result[field + (en ? 'En' : '')] = field === 'domain' ? values[0] || '' : values.join('\n');
  }
  return result;
}
