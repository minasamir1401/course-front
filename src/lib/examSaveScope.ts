type ExamSaveScope = {
  moduleId?: string | null;
  subExamId?: string | null;
};

export function isChildExamSave({ moduleId, subExamId }: ExamSaveScope) {
  return Boolean(moduleId && subExamId);
}

// The full exam endpoint treats modules as the complete desired collection.
// Child exam edits must omit it so a stale browser snapshot cannot delete siblings.
export function buildExamSavePayload<T extends { modules?: unknown; questions?: unknown }>(
  payload: T,
  scope: ExamSaveScope,
) {
  if (!isChildExamSave(scope)) return payload;

  const { modules: _modules, ...childSafePayload } = payload;
  return {
    ...childSafePayload,
    questionScopeId: scope.subExamId,
    questions: Array.isArray(payload.questions)
      ? payload.questions.filter((q: any) => String(q.subExamId || '') === String(scope.subExamId))
      : payload.questions,
  };
}
