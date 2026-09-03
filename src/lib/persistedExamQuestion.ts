// @ts-ignore Node's strip-types runner needs the explicit extension.
import { normalizeQuestionOptions } from './questionOptions.ts';

export function normalizePersistedExamQuestion<T extends Record<string, unknown>>(question: T) {
  return {
    ...question,
    options: normalizeQuestionOptions(question.options, []),
  };
}

export function normalizePersistedExamQuestions(questions: unknown) {
  if (!Array.isArray(questions)) return [];
  return questions.map((question) => normalizePersistedExamQuestion(question || {}));
}
