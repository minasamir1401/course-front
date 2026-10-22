import { getSubjectArtwork, parseSubjects } from './subjectArtwork';

/** Use supplied content translations; keep authored text when no translation exists. */
export function studentContentText(item: any, field: string, language: string): string {
  const value = (language === 'en' ? item?.[`${field}En`] : item?.[`${field}Ar`]) || item?.[field] || item?.[`${field}En`] || '';
  if (value && typeof value === 'object') return String(value[language] || value.ar || value.en || '');
  const text = String(value);
  if (text.trim().startsWith('{')) {
    try { const pair = JSON.parse(text); return String(pair[language] || pair.ar || pair.en || text); } catch { /* Plain authored text. */ }
  }
  return text;
}

export function studentSubjectLabel(value: unknown, language: string): string {
  return [...new Set(parseSubjects(value).map(subject => {
    const artwork = getSubjectArtwork(subject);
    return artwork.key === 'general' ? subject : language === 'ar' ? artwork.ar : artwork.en;
  }))].join(language === 'ar' ? '، ' : ', ');
}

const arabicGrades = ['الأول','الثاني','الثالث','الرابع','الخامس','السادس'];
export function studentGradeLabel(value: string | null | undefined, language: string): string {
  if (!value) return '—';
  for (let grade = 1; grade <= 12; grade++) {
    const stage = grade <= 6 ? 'الابتدائي' : grade <= 9 ? 'الإعدادي' : 'الثانوي';
    const ordinal = grade <= 6 ? grade : grade <= 9 ? grade - 6 : grade - 9;
    const ar = `الصف ${arabicGrades[ordinal - 1]} ${stage}`;
    const en = `Grade ${grade} ${grade <= 6 ? 'Primary' : grade <= 9 ? 'Preparatory' : 'Secondary'}`;
    if (value === ar || value === en || value.toLowerCase() === `grade ${grade}`) return language === 'ar' ? ar : en;
  }
  return value;
}
