import { questionMetadataFields } from '@/lib/bilingualMetadata';
import { resolveSingleCorrectOptionIndex } from '@/lib/answerEvaluation';

const hasArabicChars = (value?: string | null): boolean => /[\u0600-\u06FF]/.test(String(value || ''));
const hasEnglishChars = (value?: string | null): boolean => /[a-zA-Z]/.test(String(value || ''));

export function buildInitialCourseSectionMeta(
  examData?: { title?: string | null; titleEn?: string | null } | null,
  moduleData?: { title?: string | null; titleEn?: string | null } | null
) {
  const course = examData?.title || '';
  const section = moduleData?.title || '';
  const courseEn = examData?.titleEn || (hasEnglishChars(course) && !hasArabicChars(course) ? course : '');
  const sectionEn = moduleData?.titleEn || (hasEnglishChars(section) && !hasArabicChars(section) ? section : '');
  return { course, courseEn, section, sectionEn };
}

/** Populate missing English metadata and single-choice index when opening a question for edit. */
export function populateBilingualQuestionDraft(item: Record<string, any>) {
  for (const field of questionMetadataFields) {
    const enKey = `${field}En`;
    const baseVal = item[field];
    const enVal = item[enKey];
    if ((!enVal || !String(enVal).trim()) && baseVal && !hasArabicChars(String(baseVal))) {
      item[enKey] = String(baseVal);
    }
  }

  const outcomeEn = item.standardEn || item.learningOutcomeEn || '';
  if (outcomeEn) {
    item.standardEn = outcomeEn;
    item.learningOutcomeEn = outcomeEn;
  }

  if ((item.correctAnswerIndex === undefined || item.correctAnswerIndex === null) && item.type !== 'MULTI_SELECT') {
    const preferEn = Boolean(
      (item.textEn && (!item.text || !hasArabicChars(item.text))) ||
      (hasEnglishChars(item.text) && !hasArabicChars(item.text))
    );
    const resolvedIdx = resolveSingleCorrectOptionIndex(item, preferEn);
    if (resolvedIdx !== -1) {
      item.correctAnswerIndex = resolvedIdx;
      if (!item.correctAnswerEn && Array.isArray(item.optionsEn) && item.optionsEn[resolvedIdx]) {
        item.correctAnswerEn = item.optionsEn[resolvedIdx];
      }
    }
  }

  return item;
}
