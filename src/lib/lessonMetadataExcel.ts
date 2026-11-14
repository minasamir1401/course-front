const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/[()_\-]/g, ' ').replace(/\s+/g, ' ');

const NON_LESSON_TITLE_TOKENS = [
  'summary', 'notes', 'video', 'duration', 'slides', 'questions', 'assignments', 'attachments',
  'standard', 'indicator', 'outcome', 'domain', 'visibility', 'order', 'publish', 'cut off', 'content',
  'ملخص', 'ملاحظات', 'فيديو', 'مدة', 'المدة', 'شرائح', 'اسئلة', 'أسئلة', 'واجبات', 'مرفقات', 'معيار', 'معايير', 'مؤشر', 'مؤشرات', 'ناتج', 'نواتج', 'مجال', 'المجال'
];

export function metadataColumn(headers: unknown[], field: string, english: boolean): number {
  const aliases: Record<string, string[]> = {
    domain: ['domain', 'المجال'],
    standards: ['standard', 'المعيار', 'المعايير'],
    indicators: ['indicator', 'المؤشر', 'المؤشرات'],
    learningOutcomes: ['outcome', 'ناتج', 'نواتج', 'النواتج', 'مخرج', 'المخرجات'],
    lesson: ['lesson', 'عنوان الدرس'],
    title: ['lesson title', 'عنوان الدرس'],
    summary: ['summary', 'ملخص', 'ملخص الدرس'],
    notes: ['notes', 'ملاحظات', 'ملاحظات الدرس'],
    videoUrl: ['video', 'videourl', 'فيديو', 'رابط الفيديو'],
    duration: ['duration', 'المدة', 'مدة الدرس'],
    skill: ['skill', 'المهارة'],
    subskill: ['subskill', 'sub skill', 'المهارة الفرعية'],
    microSkill: ['micro skill', 'microskill', 'المهارة الدقيقة'],
    errorPattern: ['errorpattern', 'error pattern', 'نمط الخطأ'],
    course: ['exam', 'course', 'الاختبار'],
    section: ['section', 'القسم'],
  };
  return headers.findIndex(raw => {
    const h = normalize(raw), en = /\ben\b|\benglish\b|إنجل|انجل/.test(h);
    const correct = (aliases[field] || [field]).some(a => h.includes(a));
    if (field === 'skill' && /sub\s?skill|micro\s?skill|فرعية|دقيقة/.test(h)) return false;
    if ((field === 'lesson' || field === 'title') && NON_LESSON_TITLE_TOKENS.some(token => h.includes(token))) return false;
    if (['videoUrl', 'duration'].includes(field)) return correct;
    return correct && en === english;
  });
}

export function parseLessonMetadataRows(rows: unknown[][], title = ''): Record<string, any> {
  const headers = rows[0] || [];
  if (!['domain', 'standards', 'indicators', 'learningOutcomes'].some(field => metadataColumn(headers, field, false) >= 0 || metadataColumn(headers, field, true) >= 0)) {
    throw new Error('لم يتم العثور على أعمدة Metadata / No metadata columns found');
  }
  const data = rows.slice(1).filter(row => row.some(value => String(value ?? '').trim()));
  const titleColumns = [metadataColumn(headers, 'lesson', false), metadataColumn(headers, 'lesson', true)].filter(i => i >= 0);
  const matching = title ? data.filter(row => titleColumns.some(i => normalize(row[i]) === normalize(title))) : [];
  if (title && titleColumns.length && !matching.length && data.some(row => titleColumns.some(i => String(row[i] ?? '').trim()))) {
    throw new Error('لا توجد بيانات لهذا الدرس / No metadata matches this lesson');
  }
  const activeRows = matching.length ? matching : data;
  const result: Record<string, any> = {};

  for (const field of ['domain', 'standards', 'indicators', 'learningOutcomes', 'summary', 'notes']) {
    for (const en of [false, true]) {
      const i = metadataColumn(headers, field, en);
      if (i < 0) continue;
      const values = [...new Set(activeRows.map(row => String(row[i] ?? '').trim()).filter(Boolean))];
      result[field + (en ? 'En' : '')] = ['domain', 'summary', 'notes'].includes(field) ? values[0] || '' : values.join('\n');
    }
  }

  for (const en of [false, true]) {
    const titleIdx = metadataColumn(headers, 'title', en);
    if (titleIdx >= 0) {
      const firstTitle = activeRows.map(row => String(row[titleIdx] ?? '').trim()).find(Boolean);
      if (firstTitle && (en || !title)) {
        result[en ? 'titleEn' : 'title'] = firstTitle;
      }
    }
  }

  const videoIdx = metadataColumn(headers, 'videoUrl', false);
  if (videoIdx >= 0) {
    const videoVal = activeRows.map(row => String(row[videoIdx] ?? '').trim()).find(Boolean);
    if (videoVal) result.videoUrl = videoVal;
  }

  const durationIdx = metadataColumn(headers, 'duration', false);
  if (durationIdx >= 0) {
    const rawDur = activeRows.map(row => String(row[durationIdx] ?? '').trim()).find(Boolean);
    if (rawDur !== undefined) {
      const parsedDur = Number(rawDur);
      if (!Number.isNaN(parsedDur) && parsedDur >= 0) result.duration = parsedDur;
    }
  }

  return result;
}

export function buildLessonMetadataExportRows(lesson: any, language: string = 'ar'): any[][] {
  const isEn = language === 'en';
  const headers = [
    isEn ? 'Lesson Title (Ar)' : 'عنوان الدرس بالعربية',
    isEn ? 'Lesson Title (En)' : 'عنوان الدرس بالإنجليزية',
    isEn ? 'Domain (Ar)' : 'المجال بالعربية',
    isEn ? 'Domain (En)' : 'المجال بالإنجليزية',
    isEn ? 'Standard (Ar)' : 'المعيار بالعربية',
    isEn ? 'Standard (En)' : 'المعيار بالإنجليزية',
    isEn ? 'Indicator (Ar)' : 'المؤشر بالعربية',
    isEn ? 'Indicator (En)' : 'المؤشر بالإنجليزية',
    isEn ? 'Outcome (Ar)' : 'ناتج التعلم بالعربية',
    isEn ? 'Outcome (En)' : 'ناتج التعلم بالإنجليزية',
    isEn ? 'Summary (Ar)' : 'ملخص الدرس بالعربية',
    isEn ? 'Summary (En)' : 'ملخص الدرس بالإنجليزية',
    isEn ? 'Notes (Ar)' : 'ملاحظات المعلم بالعربية',
    isEn ? 'Notes (En)' : 'ملاحظات المعلم بالإنجليزية',
    isEn ? 'Video URL' : 'رابط الفيديو',
    isEn ? 'Duration (Sec)' : 'مدة الدرس بالثواني',
  ];

  const row = [
    lesson?.title || '',
    lesson?.titleEn || '',
    lesson?.domain || '',
    lesson?.domainEn || '',
    lesson?.standards || '',
    lesson?.standardsEn || '',
    lesson?.indicators || '',
    lesson?.indicatorsEn || '',
    lesson?.learningOutcomes || '',
    lesson?.learningOutcomesEn || '',
    lesson?.summary || '',
    lesson?.summaryEn || '',
    lesson?.notes || '',
    lesson?.notesEn || '',
    lesson?.videoUrl || '',
    lesson?.duration ?? 0,
  ];

  return [headers, row];
}

export function exportLessonMetadataWorkbook(lesson: any, language: string = 'ar', XLSX: any) {
  const rows = buildLessonMetadataExportRows(lesson, language);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = rows[0].map(() => ({ wch: 28 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Metadata');
  const safeName = String(lesson?.title || 'lesson').replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_').slice(0, 40) || 'lesson';
  XLSX.writeFile(wb, `${safeName}_metadata_backup.xlsx`);
}
