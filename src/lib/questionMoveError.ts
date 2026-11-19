export function questionMoveError(
  payload: { code?: string; error?: string } | null,
  status: number,
  isArabic: boolean,
) {
  if (status === 403) {
    if (payload?.code === 'EXAM_MOVE_SOURCE_FORBIDDEN' || payload?.error === 'Access denied: You do not have permission to move questions from this exam.') {
      return isArabic ? 'حسابك معندوش صلاحية ينقل أسئلة من الامتحان المصدر.' : 'Your account cannot move questions out of the source exam.';
    }
    if (payload?.code === 'EXAM_MOVE_TARGET_FORBIDDEN' || payload?.error === 'Access denied: You do not have permission to move content into this exam.') {
      return isArabic ? 'اختار امتحان تقدر تعدّل عليه عشان تنقل الأسئلة إليه.' : 'Choose a destination exam you can edit.';
    }
    return isArabic ? 'الحساب الحالي معندوش صلاحية نقل الأسئلة.' : 'Your current account cannot move questions.';
  }
  return payload?.error || (isArabic ? 'تعذّر نقل الأسئلة.' : 'Could not move the questions.');
}
