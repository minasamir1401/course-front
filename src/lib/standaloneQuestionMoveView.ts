type StandaloneMoveTarget = {
  id: string;
  examId: string;
  examTitle?: string | null;
  moduleId: string;
  moduleTitle?: string | null;
  title?: string | null;
  questionsCount?: number | null;
  _count?: { questions?: number | null } | null;
};

type StandaloneMoveContext = {
  standaloneCount?: number | null;
  targets?: StandaloneMoveTarget[] | null;
};

export function buildStandaloneMoveGroups(targets: StandaloneMoveTarget[] = []) {
  return Object.values(
    targets.reduce((groups: Record<string, any>, target) => {
      const key = `${target.examId}::${target.moduleId}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          examId: target.examId,
          examTitle: target.examTitle ?? null,
          moduleId: target.moduleId,
          moduleTitle: target.moduleTitle ?? null,
          exams: [],
        };
      }
      groups[key].exams.push(target);
      return groups;
    }, {}),
  );
}

export function buildStandaloneMoveSelectionSummary(
  context: StandaloneMoveContext | null | undefined,
  selectedTargetId: string | null | undefined,
  language: 'ar' | 'en',
) {
  const selectedTarget = context?.targets?.find((target) => target.id === selectedTargetId);
  if (!selectedTarget) return null;

  const count = context?.standaloneCount ?? 0;
  const targetTitle = selectedTarget.title || (language === 'ar' ? 'اختبار بدون عنوان' : 'Untitled Exam');
  const moduleTitle = selectedTarget.moduleTitle || (language === 'ar' ? 'موديول بدون عنوان' : 'Untitled Module');

  if (language === 'ar') {
    return `سيتم نقل ${count} ${count === 1 ? 'سؤال' : 'أسئلة'} إلى: ${targetTitle} داخل موديول ${moduleTitle}`;
  }

  return `${count} questions will move to: ${targetTitle} in module ${moduleTitle}`;
}
