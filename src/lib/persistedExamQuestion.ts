// @ts-ignore Node's strip-types runner needs the explicit extension.
import { normalizeQuestionOptions } from './questionOptions.ts';

export function normalizeQuestionSections(explanation: unknown, existingSections?: unknown): any[] {
  if (Array.isArray(existingSections) && existingSections.length > 0) {
    return existingSections;
  }
  if (!explanation) return [];
  if (typeof explanation === 'string') {
    const trimmed = explanation.trim();
    if (!trimmed || trimmed === '[]' || trimmed === '""' || trimmed === '[{"type":"EXPLANATION","content":""}]') {
      return [];
    }
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any, idx: number) => ({
            id: item.id || Date.now() + idx,
            type: item.type || 'EXPLANATION',
            content: item.content || item.text || '',
          }));
        }
      } catch (e) {}
    }
    return [{ id: Date.now(), type: 'EXPLANATION', content: trimmed }];
  }
  if (Array.isArray(explanation) && explanation.length > 0) {
    return explanation.map((item: any, idx: number) => ({
      id: item.id || Date.now() + idx,
      type: item.type || 'EXPLANATION',
      content: item.content || item.text || '',
    }));
  }
  return [];
}

export function normalizePersistedExamQuestion<T extends Record<string, unknown>>(question: T) {
  const sections = normalizeQuestionSections(question.explanation, (question as any).sections);
  return {
    ...question,
    options: normalizeQuestionOptions(question.options, []),
    sections,
    explanation: question.explanation || (sections.length > 0 ? JSON.stringify(sections) : null),
  };
}

export function normalizePersistedExamQuestions(questions: unknown) {
  if (!Array.isArray(questions)) return [];
  return questions.map((question) => normalizePersistedExamQuestion(question || {}));
}

