type Language = 'ar' | 'en';

export function getExamAudienceLabel(exam: any, language: Language) {
  if (exam?.isCentral) return language === 'ar' ? 'مركزي' : 'Central';

  const schoolNames = [
    ...(Array.isArray(exam?.schools) ? exam.schools : []),
    exam?.school,
  ]
    .map((school) => String(school?.name || '').trim())
    .filter(Boolean);

  if (schoolNames.length > 0) return [...new Set(schoolNames)].join(language === 'ar' ? '، ' : ', ');
  return language === 'ar' ? 'غير محدد' : 'Unassigned';
}

export function getCreatedAtLabel(value: unknown, language: Language) {
  if (!value) return language === 'ar' ? 'تاريخ الإنشاء غير متاح' : 'Creation date unavailable';

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return language === 'ar' ? 'تاريخ الإنشاء غير متاح' : 'Creation date unavailable';

  const formatted = date.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return `${language === 'ar' ? 'تم الإنشاء' : 'Created'}: ${formatted}`;
}

export function getUpdatedAtLabel(value: unknown, language: Language) {
  if (!value) return language === 'ar' ? 'آخر تعديل غير متاح' : 'Last updated unavailable';

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return language === 'ar' ? 'آخر تعديل غير متاح' : 'Last updated unavailable';

  const formatted = date.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return `${language === 'ar' ? 'آخر تعديل' : 'Last updated'}: ${formatted}`;
}

export function getCreatorLabel(value: unknown, language: Language) {
  const creatorName = String(value || '').trim();
  const fallback = language === 'ar' ? 'غير مسجل' : 'Not recorded';

  return language === 'ar'
    ? `أنشأه: ${creatorName || fallback}`
    : `Created by: ${creatorName || fallback}`;
}
