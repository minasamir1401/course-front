import { apiFetch } from '@/lib/api';
export async function competitionRequest(path: string, body?: unknown, method = 'POST') {
  const response = await apiFetch(`/api/competitions${path}`, body === undefined ? { cache: 'no-store' } : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'SERVER_ERROR'); return data;
}
export function competitionError(code: string, ar: boolean) {
  const messages: Record<string, [string, string]> = {
    ADMIN_REQUIRED: ['إنشاء وإدارة المسابقات متاحان للسوبر أدمن وإدارة المدرسة فقط.', 'Only platform and school administrators can manage competitions.'],
    EDIT_CLOSED: ['المسابقة ملغاة ولا تقبل تعديلات.', 'Cancelled competitions cannot be edited.'],
    PLAY_SETTINGS_LOCKED: ['طريقة المشاركة والنقاط والفرق ثابتة بعد انضمام الطلاب. يمكنك تعديل الأسئلة وباقي البيانات.', 'Play mode, scoring and teams are fixed after students join. Questions and other details remain editable.'],
    LIVE_QUESTIONS_LOCKED: ['أسئلة الجولة المباشرة ثابتة بعد انضمام الطلاب وحتى انتهاء الجولة.', 'Live questions stay fixed after students join until the round ends.'],
    EMPTY_COMPETITION: ['المسابقة المنشورة تحتاج سؤالًا واحدًا على الأقل.', 'A published competition needs at least one question.'],
    CAPACITY_BELOW_PARTICIPANTS: ['الحد الأقصى للمشاركين لا يمكن أن يقل عن عدد الطلاب المنضمين.', 'Capacity cannot be lower than the number of joined students.'],
    AUDIENCE_DETAILS: ['راجع المدرسة والصف الدراسي المحددين.', 'Review the selected school and grade.'],
    SCHOOL_NOT_FOUND: ['المدرسة المحددة غير متاحة. اختر مدرسة نشطة.', 'The selected school is unavailable. Choose an active school.'],
    SCHOOL_ACCESS: ['يمكنك تخصيص المسابقة لمدرستك فقط.', 'You can target only your own school.'],
    AUDIENCE_HAS_PARTICIPANTS: ['لا يمكن تغيير المدرسة أو الصف بعد انضمام طلاب للمسابقة، للحفاظ على مشاركاتهم ونتائجهم.', 'The school and grade cannot change after students have joined, to preserve their participation and results.'],
    AUDIENCE_LOCKED: ['تعديل المدرسة والصف متاح للمسابقات المستقلة قبل انضمام الطلاب أو بدء الجولة المباشرة، وحتى إغلاق المسابقة.', 'School and grade can be edited for standalone competitions before students join or a live round starts, while the competition is a draft or published.'],
    QUESTION_LIMIT: ['الحد الأقصى 500 سؤال للمسابقة.', 'A competition supports up to 500 questions.'],
    INCOMPLETE_QUESTIONS: ['راجع مفاتيح الإجابة للأسئلة المنقولة قبل نشر المسابقة.', 'Review the imported question answer keys before publishing.'],
    ANSWER_KEY: ['مفتاح الإجابة يحتاج مراجعة.', 'The answer key needs review.'],
    TRANSLATION: ['راجع ترجمة الاختيارات وعددها.', 'Review the translated choices and their count.'],
    QUESTION: ['راجع نوع السؤال ونصه ودرجته ووقته واختياراته.', 'Review the question type, text, points, timing and choices.'],
    IMPORT_OPTIONS: ['راجع المصدر ووقت السؤال المختار للاستيراد.', 'Check the source and question time for import.'],
    CONTENT_ACCESS: ['المحتوى غير متاح ضمن صلاحيات حسابك.', 'This content is outside your account access.'],
    CONTENT_NOT_FOUND: ['احفظ المحتوى أولًا ثم حدّث إعدادات العرض.', 'Save the content first, then refresh presentation settings.'],
    CONTENT_UNAVAILABLE: ['المحتوى خارج موعد الإتاحة. راجع موعد فتحه وإغلاقه.', 'This content is outside its availability window. Check its opening and closing times.'],
    PASSWORD_REQUIRED: ['كلمة مرور الاختبار مطلوبة أو غير صحيحة.', 'The exam password is required or incorrect.'],
    CONTENT_QUESTION_COUNT: ['المنافسة تحتاج من 1 إلى 50 سؤالًا محفوظًا في هذا المحتوى.', 'A competition needs 1–50 saved questions in this content.'],
    UNSUPPORTED_CONTENT_QUESTION: ['راجع الأسئلة: المنافسة تدعم اختيار إجابة واحدة من 2 إلى 4 خيارات، بإجابة صحيحة واضحة. لم يتغير أي سؤال.', 'Check the questions: use a single correct answer and 2–4 choices. No questions have been changed.'],
    INVALID_CONTENT_COMPETITION: ['راجع الأسئلة وخياراتها ووقت السؤال وإعدادات المنافسة.', 'Check the questions, choices, question time and competition settings.'],
    PUBLISHED_CONTENT_LOCKED: ['إعدادات المنافسة ثابتة بعد النشر. يمكنك التحكم في التشغيل أو العودة للتقييم العادي.', 'Competition settings are fixed after publication. Use the host controls or switch back to Standard assessment.'],
    INVALID_COMPETITION: ['راجع عنوان المنافسة والأسئلة والإجابات الصحيحة والمواعيد.', 'Check the title, questions, correct choices and schedule.'],
    NOT_FOUND: ['هذه المنافسة غير متاحة لحسابك.', 'This competition is not available to your account.'],
    DISABLED: ['المنافسات متوقفة حاليًا بواسطة الإدارة.', 'Competitions are currently disabled by administration.'],
    NOT_STARTED: ['لم يحن موعد البداية بعد.', 'The competition has not opened yet.'], CLOSED: ['انتهت المنافسة أو انتهى وقت المشاركة.', 'The competition or participation window has closed.'],
    FULL: ['اكتمل عدد المشاركين في هذه المنافسة.', 'This competition is full.'], STALE_QUESTION: ['انتقلنا لسؤال آخر. تم تحديث الصفحة.', 'The question changed. The page has been refreshed.'],
    WAIT_FOR_LAST_QUESTION: ['انتظر انتهاء وقت السؤال الأخير قبل إعلان النتائج.', 'Wait until the final question timer ends before declaring results.'],
    DRAFT_ONLY: ['تعديل الأسئلة متاح قبل النشر فقط.', 'Questions can only be edited before publishing.'],
    SOURCE_REQUIRED: ['اختر المقرر أو الامتحان أو محور النشاط المرتبط.', 'Choose the linked course, exam or activity cluster.'],
    SOURCE_NOT_FOUND: ['المحتوى المختار غير متاح في نطاق صلاحياتك.', 'The selected content is outside your access.'],
  };
  return messages[code]?.[ar ? 0 : 1] || (ar ? 'تعذر إتمام العملية. حاول مرة أخرى.' : 'Could not complete the request. Please retry.');
}
