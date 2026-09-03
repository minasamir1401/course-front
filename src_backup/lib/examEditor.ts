export type ExamEditorQuestion = Record<string, any> & {
  id?: string;
  order?: number;
  _clientId?: string;
};

let clientQuestionSequence = 0;

export const createExamQuestionClientId = () => {
  clientQuestionSequence += 1;

  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `exam-question-${Date.now()}-${clientQuestionSequence}`;
};

export const withExamQuestionClientId = <T extends ExamEditorQuestion>(question: T): T => {
  if (question._clientId) return question;
  return { ...question, _clientId: createExamQuestionClientId() };
};

export const normalizeExamQuestionOrder = <T extends ExamEditorQuestion>(questions: T[]): T[] =>
  questions.map((question, index) => ({
    ...withExamQuestionClientId(question),
    order: index,
  }));

export const upsertExamQuestionDraft = <T extends ExamEditorQuestion>(
  questions: T[],
  draft: T,
  editingIndex: number | null,
): T[] => {
  const normalizedQuestions = normalizeExamQuestionOrder(questions);
  const normalizedDraft = withExamQuestionClientId(draft);
  const clientMatchIndex = normalizedQuestions.findIndex(
    (question) => question._clientId === normalizedDraft._clientId,
  );
  const idMatchIndex = normalizedDraft.id
    ? normalizedQuestions.findIndex((question) => question.id === normalizedDraft.id)
    : -1;
  const targetIndex = clientMatchIndex >= 0
    ? clientMatchIndex
    : idMatchIndex >= 0
      ? idMatchIndex
      : editingIndex !== null && editingIndex >= 0 && editingIndex < normalizedQuestions.length
        ? editingIndex
        : -1;

  if (targetIndex >= 0) {
    const next = [...normalizedQuestions];
    next[targetIndex] = { ...normalizedDraft, order: targetIndex };
    return normalizeExamQuestionOrder(next);
  }

  return normalizeExamQuestionOrder([...normalizedQuestions, normalizedDraft]);
};

const serverQuestionForSubmission = (
  submittedQuestion: ExamEditorQuestion,
  submittedIndex: number,
  serverQuestions: ExamEditorQuestion[],
) => {
  if (submittedQuestion.id) {
    const idMatch = serverQuestions.find((question) => question.id === submittedQuestion.id);
    if (idMatch) return idMatch;
  }

  // Only fall back to order-based matching when the question text is the same.
  // A pure position match can pick the wrong server question after a reorder
  // or mid-list insert, causing subsequent autosaves to create duplicates.
  const submittedText = String(submittedQuestion.text || '').trim();
  const byOrder = serverQuestions.find((question) => Number(question.order) === submittedIndex);
  if (byOrder && submittedText && String(byOrder.text || '').trim() === submittedText) {
    return byOrder;
  }

  const byIndex = serverQuestions[submittedIndex];
  if (byIndex && submittedText && String(byIndex.text || '').trim() === submittedText) {
    return byIndex;
  }

  return undefined;
};

export const reconcileSavedExamQuestionIds = <T extends ExamEditorQuestion>(
  localQuestions: T[],
  submittedQuestions: ExamEditorQuestion[],
  serverQuestions: ExamEditorQuestion[] | undefined,
): T[] => {
  if (!Array.isArray(serverQuestions)) return normalizeExamQuestionOrder(localQuestions);

  const savedIdByClientId = new Map<string, string>();
  submittedQuestions.forEach((submittedQuestion, index) => {
    const serverQuestion = serverQuestionForSubmission(submittedQuestion, index, serverQuestions);
    if (submittedQuestion._clientId && serverQuestion?.id) {
      savedIdByClientId.set(submittedQuestion._clientId, serverQuestion.id);
    }
  });

  return normalizeExamQuestionOrder(localQuestions.map((question) => {
    const savedId = question._clientId
      ? savedIdByClientId.get(question._clientId)
      : undefined;
    return savedId && !question.id ? { ...question, id: savedId } : question;
  }));
};

export const reconcileSavedExamQuestion = <T extends ExamEditorQuestion>(
  question: T,
  submittedQuestions: ExamEditorQuestion[],
  serverQuestions: ExamEditorQuestion[] | undefined,
): T => reconcileSavedExamQuestionIds([question], submittedQuestions, serverQuestions)[0];

export const examQuestionReactKey = (question: ExamEditorQuestion) =>
  question._clientId || question.id || createExamQuestionClientId();

export const enqueueSerializedExamSave = <T>(
  queueRef: { current: Promise<unknown> },
  operation: () => Promise<T>,
): Promise<T> => {
  const queuedOperation = queueRef.current
    .catch(() => undefined)
    .then(operation);

  queueRef.current = queuedOperation.then(
    () => undefined,
    () => undefined,
  );

  return queuedOperation;
};

export const withoutExamQuestionClientMetadata = <T extends ExamEditorQuestion>(question: T) => {
  const persistedQuestion = { ...question };
  delete persistedQuestion._clientId;
  return persistedQuestion;
};
