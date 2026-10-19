export type ExamAvailability = 'AVAILABLE' | 'UPCOMING' | 'CLOSED' | 'COMPLETED';
/** Display-only gate; the server remains authoritative when starting or submitting. */
export function studentExamAvailability(exam: any, submissions: any[] = [], parent?: any, now = Date.now()): ExamAvailability {
  if ([parent?.endDate, parent?.cutOffDate, exam?.endDate, exam?.cutOffDate].filter(Boolean).some(date => Date.parse(date) <= now)) return 'CLOSED';
  if ([parent?.startDate, parent?.publishDate, exam?.startDate, exam?.publishDate].filter(Boolean).some(date => Date.parse(date) > now)) return 'UPCOMING';
  const sections = (exam?.modules || []).flatMap((section: any) => [section, ...(section.subModules || [])]);
  const children = sections.flatMap((section: any) => section.subExams || []);
  if (children.length) {
    const states: ExamAvailability[] = children.map((child: any) => studentExamAvailability(child, submissions.filter(item => item.subExamId === child.id), exam, now));
    for (const section of sections.filter((item: any) => !item.subExams?.length && (item.questionsCount || item._count?.questions || item.questions?.length))) {
      states.push(studentExamAvailability({ ...section, attemptsAllowed: exam.attemptsAllowed }, submissions.filter(item => !item.subExamId), exam, now));
    }
    if (states.includes('AVAILABLE')) return 'AVAILABLE';
    if (states.includes('UPCOMING')) return 'UPCOMING';
    return states.every(state => state === 'COMPLETED') ? 'COMPLETED' : 'CLOSED';
  }
  const attempts = Number(exam?.attemptsAllowed ?? parent?.attemptsAllowed ?? 1);
  if (attempts > 0 && attempts !== 999 && submissions.length >= attempts) return 'COMPLETED';
  return 'AVAILABLE';
}
export function latestStudentSubmission(submissions: any[] = []) {
  return [...submissions].filter(item => item.id).sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))[0];
}
export function examAvailabilityLabel(status: ExamAvailability, ar: boolean) {
  return ({ AVAILABLE: ['متاح الآن', 'Available now'], UPCOMING: ['لم يبدأ بعد', 'Upcoming'], CLOSED: ['انتهى الموعد', 'Closed'], COMPLETED: ['اكتملت المحاولات', 'Attempts completed'] })[status][ar ? 0 : 1];
}
