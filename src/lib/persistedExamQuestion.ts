// @ts-ignore Node's strip-types runner needs the explicit extension.
import { normalizeQuestionOptions } from './questionOptions.ts';
// @ts-ignore Node's strip-types runner needs the explicit extension.
import { resolveSingleCorrectOptionIndex } from './answerEvaluation.ts';

function readQuestionSections(explanation: unknown, existingSections?: unknown): any[] {
  if (Array.isArray(existingSections) && existingSections.length > 0) {
    return existingSections.map((item: any, idx: number) => ({
      ...item,
      id: item?.id || Date.now() + idx,
      type: item?.type || 'EXPLANATION',
      content: item?.content || item?.text || '',
      contentEn: item?.contentEn || item?.textEn || '',
    }));
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
            ...item,
            id: item?.id || Date.now() + idx,
            type: item?.type || 'EXPLANATION',
            content: item?.content || item?.text || '',
            contentEn: item?.contentEn || item?.textEn || '',
          }));
        }
      } catch (e) {}
    }
    return [{ id: Date.now(), type: 'EXPLANATION', content: trimmed, contentEn: '' }];
  }
  if (Array.isArray(explanation) && explanation.length > 0) {
    return explanation.map((item: any, idx: number) => ({
      ...item,
      id: item?.id || Date.now() + idx,
      type: item?.type || 'EXPLANATION',
      content: item?.content || item?.text || '',
      contentEn: item?.contentEn || item?.textEn || '',
    }));
  }
  return [];
}

export function normalizeQuestionSections(explanation: unknown, existingSections?: unknown, explanationEn?: unknown): any[] {
  const sections = readQuestionSections(explanation, existingSections);
  const english = readQuestionSections(explanationEn);
  if (!english.length) return sections;
  return Array.from({ length: Math.max(sections.length, english.length) }, (_, index) => ({
    ...(sections[index] || { id: Date.now() + index, type: 'EXPLANATION', content: '' }),
    contentEn: sections[index]?.contentEn || english[index]?.contentEn || english[index]?.content || '',
  }));
}

const COLLIDED_LABEL_RE = /^(Point|Line|Segment|Ray|Angle|Triangle|Circle|Polygon|Rectangle|Square|Quadrilateral|Graph|Figure|Diagram|Option|Choice|Vertex|Matrix|Vector|Curve|Arc|Plane)\s+([A-Z]{1,4}'?)$/i;

function repairCollidedBilingualOptions(question: Record<string, any>) {
  const type = String(question.type || question.label || 'MCQ').toUpperCase();
  if (type === 'MULTI_SELECT' || type === 'TRUE_FALSE' || type === 'TEXT') return question;

  const optsAr: string[] = Array.isArray(question.options) ? [...question.options] : [];
  const optsEn: string[] = Array.isArray(question.optionsEn) ? [...question.optionsEn] : [];
  if (optsAr.length < 2 || optsEn.length !== optsAr.length) return question;

  const norm = (value: unknown) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  const groups = new Map<string, number[]>();
  optsAr.forEach((opt, idx) => {
    const key = norm(opt);
    if (!key) return;
    const list = groups.get(key) || [];
    list.push(idx);
    groups.set(key, list);
  });

  const hasCollision = Array.from(groups.values()).some(
    (indices) => indices.length > 1 && new Set(indices.map((i) => norm(optsEn[i]))).size > 1
  );
  if (!hasCollision) return question;

  const resolvedIdx = resolveSingleCorrectOptionIndex(question, true);
  const repaired = [...optsAr];

  for (const indices of groups.values()) {
    if (indices.length < 2) continue;
    if (new Set(indices.map((i) => norm(optsEn[i]))).size < 2) continue;

    const suffixTokens = indices.map((i) => {
      const m = String(optsEn[i] ?? '').trim().match(/([A-Za-z0-9']+)$/);
      return m ? m[1] : '';
    });
    if (suffixTokens.every(Boolean) && new Set(suffixTokens.map((t) => t.toLowerCase())).size === indices.length) {
      const candidate = indices.map((i, k) => {
        const cur = String(repaired[i] ?? '').trim();
        const replaced = cur.replace(/\s+\S+$/, ` ${suffixTokens[k]}`);
        return replaced !== cur ? replaced : `${cur} (${suffixTokens[k]})`;
      });
      if (new Set(candidate.map(norm)).size === indices.length) {
        indices.forEach((i, k) => { repaired[i] = candidate[k]; });
        continue;
      }
    }

    indices.forEach((i) => {
      const enText = String(optsEn[i] ?? '').trim();
      const cur = String(repaired[i] ?? '').trim();
      if (enText && !norm(cur).includes(norm(enText))) {
        repaired[i] = `${cur} (${enText})`;
      }
    });
  }

  // If the question had a collided label group (like Point Q / Point S -> النقطة س), normalize sibling Arabic label letters too.
  repaired.forEach((opt, i) => {
    const enMatch = String(optsEn[i] ?? '').trim().match(COLLIDED_LABEL_RE);
    if (enMatch && /^[\u0600-\u06FF\s]+$/.test(String(opt ?? '').trim())) {
      const replaced = String(opt).trim().replace(/\s+\S+$/, ` ${enMatch[2].toUpperCase()}`);
      if (replaced !== String(opt).trim()) repaired[i] = replaced;
    }
  });

  const next: Record<string, any> = { ...question, options: repaired };
  if (resolvedIdx >= 0 && resolvedIdx < repaired.length) {
    next.correctAnswer = repaired[resolvedIdx] || question.correctAnswer;
    if (!next.correctAnswerEn && optsEn[resolvedIdx]) {
      next.correctAnswerEn = optsEn[resolvedIdx];
    }
    next.correctAnswerIndex = resolvedIdx;
  }
  return next;
}

export function normalizePersistedExamQuestion<T extends Record<string, unknown>>(question: T) {
  const sections = normalizeQuestionSections(question.explanation, (question as any).sections, question.explanationEn);
  const qAny = question as any;
  const normalized = {
    ...question,
    textEn: qAny.textEn || '',
    options: normalizeQuestionOptions(question.options, []),
    optionsEn: qAny.optionsEn ? normalizeQuestionOptions(qAny.optionsEn, []) : [],
    explanationEn: qAny.explanationEn || '',
    hint: qAny.hint || '',
    hintEn: qAny.hintEn || '',
    sections,
    explanation: question.explanation || (sections.length > 0 ? JSON.stringify(sections) : null),
  };
  return repairCollidedBilingualOptions(normalized) as typeof normalized;
}

export function normalizePersistedExamQuestions(questions: unknown) {
  if (!Array.isArray(questions)) return [];
  return questions.map((question) => normalizePersistedExamQuestion(question || {}));
}

