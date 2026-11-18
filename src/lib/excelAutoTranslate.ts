import { translateBatch } from './translationService';

export type ExcelTranslationKind = 'content' | 'metadata';

const ARABIC_CHAR_RE = /[\u0600-\u06FF]/;
const LATIN_CHAR_RE = /[A-Za-z]/;
const INLINE_TABLE_BLOCK_RE = /(\[TABLE\][\s\S]*?\[\/TABLE\])/gi;

const INTERACTIVE_OBJECT_KEYS = ['front', 'back', 'text', 'label', 'title', 'left', 'right', 'word', 'clue', 'question'] as const;

const ITEM_FIELD_PAIRS: ReadonlyArray<readonly [string, string, ExcelTranslationKind]> = [
  ['title', 'titleEn', 'content'],
  ['text', 'textEn', 'content'],
  ['content', 'contentEn', 'content'],
  ['questionText', 'questionTextEn', 'content'],
  ['explanation', 'explanationEn', 'content'],
  ['hint', 'hintEn', 'content'],
  ['tip', 'tipEn', 'content'],
  ['keyInsight', 'keyInsightEn', 'content'],
  ['domain', 'domainEn', 'metadata'],
  ['standard', 'standardEn', 'metadata'],
  ['indicator', 'indicatorEn', 'metadata'],
  ['learningOutcome', 'learningOutcomeEn', 'metadata'],
  ['skill', 'skillEn', 'metadata'],
  ['subskill', 'subskillEn', 'metadata'],
  ['microSkill', 'microSkillEn', 'metadata'],
  ['errorPattern', 'errorPatternEn', 'metadata'],
  ['course', 'courseEn', 'metadata'],
  ['section', 'sectionEn', 'metadata'],
];

const METADATA_ONLY_PAIRS: ReadonlyArray<readonly [string, string, ExcelTranslationKind]> = [
  ['domain', 'domainEn', 'metadata'],
  ['standard', 'standardEn', 'metadata'],
  ['indicator', 'indicatorEn', 'metadata'],
  ['learningOutcome', 'learningOutcomeEn', 'metadata'],
  ['skill', 'skillEn', 'metadata'],
  ['subskill', 'subskillEn', 'metadata'],
  ['microSkill', 'microSkillEn', 'metadata'],
  ['errorPattern', 'errorPatternEn', 'metadata'],
  ['course', 'courseEn', 'metadata'],
  ['section', 'sectionEn', 'metadata'],
  ['explanation', 'explanationEn', 'content'],
  ['hint', 'hintEn', 'content'],
  ['tip', 'tipEn', 'content'],
  ['keyInsight', 'keyInsightEn', 'content'],
];

const LESSON_METADATA_SINGLE_FIELDS: ReadonlyArray<readonly [string, string, ExcelTranslationKind]> = [
  ['title', 'titleEn', 'content'],
  ['domain', 'domainEn', 'metadata'],
  ['summary', 'summaryEn', 'content'],
  ['notes', 'notesEn', 'content'],
  ['content', 'contentEn', 'content'],
];

const LESSON_METADATA_LIST_FIELDS: ReadonlyArray<readonly [string, string, ExcelTranslationKind]> = [
  ['standards', 'standardsEn', 'metadata'],
  ['indicators', 'indicatorsEn', 'metadata'],
  ['learningOutcomes', 'learningOutcomesEn', 'metadata'],
];

function stripMarkupAndMath(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<math\b[^>]*>[\s\S]*?<\/math>/gi, ' ')
    .replace(/<img\b[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/g, ' ')
    .replace(/\\\[[\s\S]+?\\\]/g, ' ')
    .replace(/\\\([\s\S]+?\\\)/g, ' ')
    .replace(/\$(?:\\.|[^$\n])+\$/g, ' ')
    .replace(/__[A-Z_]+_\d+__/g, ' ')
    .replace(/\[\/?(?:TABLE|SLIDE)\]/gi, ' ')
    .replace(/&(?:nbsp|amp|lt|gt|quot|#\d+);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasArabicVisibleText(value: unknown): boolean {
  const plain = stripMarkupAndMath(value);
  return ARABIC_CHAR_RE.test(plain);
}

export function isMetadataIdentifier(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (!LATIN_CHAR_RE.test(trimmed)) return true;
  if (/^[A-F]$/i.test(trimmed)) return true;
  if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed) || /^\S+@\S+\.\S+$/.test(trimmed)) return true;
  if (/^DOK\s*\d+$/i.test(trimmed)) return true;
  // Uppercase or digit-bearing hierarchical codes like MATH.7.NS.3 or CCSS.ELA-LITERACY.RL.5.1 stay untranslated.
  if (/^[A-Z0-9]+(?:[._:/-][A-Z0-9]+)+$/.test(trimmed)) return true;
  if (/^[A-Za-z]+(?:[._:/-]\d+[A-Za-z0-9._:/-]*)+$/.test(trimmed)) return true;
  if (/^(?:MCQ|TRUE_FALSE|MULTI_SELECT|FILL_BLANK|SHORT_ANSWER|MATCHING|DRAG_DROP_FILL|GROUP_SORTING|FLASH_CARD|MEMORY_GAME|WORD_SCRAMBLE|SENTENCE_REORDER|MATH_EQUATION|SEQUENCE_ORDER|CROSSWORD|COUNT_OBJECTS|IMAGE_LABEL|COLOR_MATCH|WORD_SEARCH|SWIPE_SORT|MIND_MAP|CLOCK|NUMBER_LINE|MAZE|GEOGEBRA|VIDEO_CHECKPOINT|IMAGE|TEXT|VIDEO|HTML|TABLE)$/i.test(trimmed)) {
    return true;
  }
  return false;
}

export function isEnglishWithoutArabic(value: unknown, kind: ExcelTranslationKind = 'content'): boolean {
  if (typeof value !== 'string' || !value.trim()) return false;
  if (hasArabicVisibleText(value)) return false;
  const plain = stripMarkupAndMath(value);
  if (!plain || !LATIN_CHAR_RE.test(plain)) return false;
  if (kind === 'metadata' && isMetadataIdentifier(plain)) return false;
  return true;
}

function tryParseJson(value: unknown): { parsed: any; wasJsonString: boolean } {
  if (typeof value !== 'string') return { parsed: value, wasJsonString: false };
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith('[') && !trimmed.startsWith('{'))) {
    return { parsed: value, wasJsonString: false };
  }
  try {
    return { parsed: JSON.parse(trimmed), wasJsonString: true };
  } catch {
    return { parsed: value, wasJsonString: false };
  }
}

function normalizeChoiceMatch(a: unknown, b: unknown): boolean {
  const norm = (v: unknown) => String(v ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  const na = norm(a);
  return Boolean(na) && na === norm(b);
}

function isTrueFalseList(opts: string[]): boolean {
  if (opts.length !== 2) return false;
  const norm = opts.map((o) => o.trim().toLowerCase());
  return (
    (norm.includes('true') && norm.includes('false')) ||
    ((norm.includes('صحيح') || norm.includes('صح')) && norm.includes('خطأ'))
  );
}

function resolveOptionIndex(raw: string, opts: string[]): number {
  const val = String(raw ?? '').trim();
  if (!val) return -1;
  const textMatch = opts.findIndex((o) => normalizeChoiceMatch(o, val));
  if (textMatch >= 0) return textMatch;
  if (/^[1-9]$/.test(val)) {
    const idx = Number(val) - 1;
    return idx >= 0 && idx < opts.length ? idx : -1;
  }
  const enIdx = ['A', 'B', 'C', 'D', 'E', 'F'].indexOf(val.toUpperCase());
  if (enIdx >= 0 && enIdx < opts.length) return enIdx;
  const arIdx = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'].indexOf(val);
  if (arIdx >= 0 && arIdx < opts.length) return arIdx;
  return -1;
}

function disambiguateTranslatedOptions(rawOpts: string[], translatedOpts: string[]): string[] {
  const norm = (v: unknown) => String(v ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  const next = [...translatedOpts];
  const groups = new Map<string, number[]>();
  next.forEach((opt, i) => {
    const key = norm(opt);
    if (!key) return;
    const list = groups.get(key) || [];
    list.push(i);
    groups.set(key, list);
  });

  for (const indices of groups.values()) {
    if (indices.length < 2) continue;
    if (new Set(indices.map((i) => norm(rawOpts[i]))).size < 2) continue;

    const suffixTokens = indices.map((i) => {
      const m = String(rawOpts[i] ?? '').trim().match(/([A-Za-z0-9']+)$/);
      return m ? m[1] : '';
    });
    if (suffixTokens.every(Boolean) && new Set(suffixTokens.map((t) => t.toLowerCase())).size === indices.length) {
      const candidate = indices.map((i, k) => {
        const cur = String(next[i] ?? '').trim();
        const replaced = cur.replace(/\s+\S+$/, ` ${suffixTokens[k]}`);
        return replaced !== cur ? replaced : `${cur} (${suffixTokens[k]})`;
      });
      if (new Set(candidate.map(norm)).size === indices.length) {
        indices.forEach((i, k) => { next[i] = candidate[k]; });
        continue;
      }
    }

    indices.forEach((i) => {
      const src = String(rawOpts[i] ?? '').trim();
      const cur = String(next[i] ?? '').trim();
      if (src && !norm(cur).includes(norm(src))) {
        next[i] = `${cur} (${src})`;
      }
    });
  }
  return next;
}

function isSingleLetterCellSymbol(cell: string): boolean {
  const plain = stripMarkupAndMath(cell);
  return /^[A-Za-z]$/.test(plain);
}

class TranslationCollector {
  private readonly queues: Record<ExcelTranslationKind, Set<string>> = {
    content: new Set<string>(),
    metadata: new Set<string>(),
  };

  private readonly maps: Record<ExcelTranslationKind, Map<string, string>> = {
    content: new Map<string, string>(),
    metadata: new Map<string, string>(),
  };

  add(text: unknown, kind: ExcelTranslationKind = 'content'): void {
    if (typeof text !== 'string' || !text.trim()) return;
    if (/\[TABLE\][\s\S]*?\[\/TABLE\]/i.test(text)) {
      this.walkInlineTables(text, (segment, isTableCell) => {
        if (isTableCell && isSingleLetterCellSymbol(segment)) return;
        if (isEnglishWithoutArabic(segment, kind)) {
          this.queues[kind].add(segment);
        }
      });
      return;
    }
    if (!isEnglishWithoutArabic(text, kind)) return;
    this.queues[kind].add(text);
  }

  addLines(text: unknown, kind: ExcelTranslationKind = 'metadata'): void {
    if (typeof text !== 'string' || !text.trim()) return;
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => this.add(line, kind));
  }

  async flush(): Promise<boolean> {
    const contentList = Array.from(this.queues.content);
    const metadataList = Array.from(this.queues.metadata);
    if (contentList.length === 0 && metadataList.length === 0) return true;

    const combined = [...contentList, ...metadataList];
    const metadataIndices = metadataList.map((_, i) => contentList.length + i);
    const metaArg: 'all' | number[] | undefined =
      metadataIndices.length === 0
        ? undefined
        : metadataIndices.length === combined.length
          ? 'all'
          : metadataIndices;

    try {
      const translated = await translateBatch(combined, 'en', 'ar', metaArg);
      contentList.forEach((src, i) => {
        if (translated[i]) this.maps.content.set(src, translated[i]);
      });
      metadataList.forEach((src, i) => {
        const val = translated[contentList.length + i];
        if (val) this.maps.metadata.set(src, val);
      });
      return true;
    } catch (error) {
      const isTestEnv = typeof process !== 'undefined' && Boolean(process.env?.NODE_TEST_CONTEXT || process.env?.JEST_WORKER_ID || process.env?.NODE_ENV === 'test');
      if (!isTestEnv) {
        console.warn('Excel auto-translation fallback to source text:', (error as Error)?.message || error);
      }
      return false;
    }
  }

  get(text: unknown, kind: ExcelTranslationKind = 'content'): string {
    if (typeof text !== 'string') return '';
    if (!text.trim()) return text;
    if (/\[TABLE\][\s\S]*?\[\/TABLE\]/i.test(text)) {
      return this.walkInlineTables(text, (segment, isTableCell) => {
        if (isTableCell && isSingleLetterCellSymbol(segment)) return segment;
        return this.maps[kind].get(segment) ?? segment;
      });
    }
    return this.maps[kind].get(text) ?? text;
  }

  getLines(text: unknown, kind: ExcelTranslationKind = 'metadata'): string {
    if (typeof text !== 'string') return '';
    return text
      .split(/\r?\n/)
      .map((line) => {
        const trimmed = line.trim();
        return trimmed ? this.get(trimmed, kind) : '';
      })
      .filter(Boolean)
      .join('\n');
  }

  private walkInlineTables(
    text: string,
    transform: (segment: string, isTableCell: boolean) => string | void
  ): string {
    const segments = text.split(INLINE_TABLE_BLOCK_RE);
    return segments
      .map((segment) => {
        const tableMatch = segment.match(/^(\[TABLE\])([\s\S]*?)(\[\/TABLE\])$/i);
        if (!tableMatch) {
          const next = transform(segment, false);
          return typeof next === 'string' ? next : segment;
        }
        const [, openTag, inner, closeTag] = tableMatch;
        const nextInner = inner
          .split(/\r?\n/)
          .map((row) => {
            if (!row.trim()) return row;
            return row
              .split('|')
              .map((cell) => {
                const leadMatch = cell.match(/^(\s*)([\s\S]*?)(\s*)$/);
                const lead = leadMatch ? leadMatch[1] : '';
                const core = leadMatch ? leadMatch[2] : cell;
                const trail = leadMatch ? leadMatch[3] : '';
                if (!core) return cell;
                const replaced = transform(core, true);
                return typeof replaced === 'string' ? `${lead}${replaced}${trail}` : cell;
              })
              .join('|');
          })
          .join('\n');
        return `${openTag}${nextInner}${closeTag}`;
      })
      .join('');
  }
}

function collectLocalizedPair(
  arVal: unknown,
  enVal: unknown,
  collector: TranslationCollector,
  kind: ExcelTranslationKind,
  multiline = false
): void {
  const ar = typeof arVal === 'string' ? arVal.trim() : '';
  const en = typeof enVal === 'string' ? enVal.trim() : '';
  const source =
    en && (!ar || ar === en || isEnglishWithoutArabic(ar, kind))
      ? (enVal as string)
      : !en && isEnglishWithoutArabic(ar, kind)
        ? (arVal as string)
        : '';
  if (!source) return;
  if (multiline) collector.addLines(source, kind);
  else collector.add(source, kind);
}

function applyLocalizedPair(
  arVal: unknown,
  enVal: unknown,
  collector: TranslationCollector,
  kind: ExcelTranslationKind,
  multiline = false
): { ar: string; en: string } {
  const ar = typeof arVal === 'string' ? arVal : '';
  const en = typeof enVal === 'string' ? enVal : '';
  const read = (src: string) => (multiline ? collector.getLines(src, kind) : collector.get(src, kind));

  if (ar.trim() && hasArabicVisibleText(ar)) {
    return { ar, en };
  }
  if (en.trim() && (!ar.trim() || ar.trim() === en.trim() || isEnglishWithoutArabic(ar, kind))) {
    return { ar: read(en), en };
  }
  if (!en.trim() && isEnglishWithoutArabic(ar, kind)) {
    return { ar: read(ar), en: ar };
  }
  return { ar, en };
}

function collectInteractiveStrings(
  optsVal: unknown,
  ansVal: unknown,
  collector: TranslationCollector,
  itemType = ''
): void {
  const { parsed: opts } = tryParseJson(optsVal);
  const { parsed: ans } = tryParseJson(ansVal);

  if (Array.isArray(opts)) {
    if (!isTrueFalseList(opts.map((v) => String(v ?? '')))) {
      for (const entry of opts) {
        if (typeof entry === 'string') collector.add(entry, 'content');
        else if (entry && typeof entry === 'object') {
          for (const key of INTERACTIVE_OBJECT_KEYS) {
            if (typeof entry[key] === 'string') collector.add(entry[key], 'content');
          }
        }
      }
    }
  } else if (opts && typeof opts === 'object') {
    for (const arrKey of ['left', 'right', 'groups', 'choices', 'words'] as const) {
      if (Array.isArray(opts[arrKey])) {
        opts[arrKey].forEach((v: unknown) => collector.add(v, 'content'));
      }
    }
    if (Array.isArray(opts.items)) {
      opts.items.forEach((entry: any) => {
        if (typeof entry === 'string') collector.add(entry, 'content');
        else if (entry && typeof entry === 'object') {
          collector.add(entry.text, 'content');
          collector.add(entry.group, 'content');
          collector.add(entry.label, 'content');
        }
      });
    }
    if (Array.isArray(opts.pairs)) {
      opts.pairs.forEach((pair: any) => {
        if (pair && typeof pair === 'object') {
          collector.add(pair.left, 'content');
          collector.add(pair.right, 'content');
          collector.add(pair.text, 'content');
        }
      });
    }
    if (typeof opts.sentence === 'string') collector.add(opts.sentence, 'content');
    if (typeof opts.prompt === 'string') collector.add(opts.prompt, 'content');
  }

  if (Array.isArray(ans)) {
    ans.forEach((v: unknown) => collector.add(v, 'content'));
  } else if (ans && typeof ans === 'object') {
    for (const [k, v] of Object.entries(ans)) {
      collector.add(k, 'content');
      if (typeof v === 'string') collector.add(v, 'content');
    }
  } else if (typeof ans === 'string' && !/^[A-F]$/i.test(ans.trim()) && !/^(true|false)$/i.test(ans.trim())) {
    if (itemType.toUpperCase() === 'MULTI_SELECT' && /[,،|;]/.test(ans)) {
      ans
        .split(/[,،|;]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((part) => collector.add(part, 'content'));
    } else {
      collector.add(ans, 'content');
    }
  }
}

function translateInteractivePayload(
  optsVal: unknown,
  ansVal: unknown,
  collector: TranslationCollector,
  itemType = ''
): {
  options: any;
  optionsEn?: any;
  correctAnswer: any;
  correctAnswerEn?: any;
} {
  const { parsed: rawOpts, wasJsonString: optsWasJson } = tryParseJson(optsVal);
  const { parsed: rawAns, wasJsonString: ansWasJson } = tryParseJson(ansVal);

  const rewrapOpts = (val: any) => (optsWasJson ? JSON.stringify(val) : val);
  const rewrapAns = (val: any) => (ansWasJson ? JSON.stringify(val) : val);

  if (Array.isArray(rawOpts) && rawOpts.every((v) => typeof v === 'string')) {
    if (isTrueFalseList(rawOpts)) {
      const tfAr = ['صحيح', 'خطأ'];
      const tfEn = ['True', 'False'];
      const ansLower = String(rawAns ?? '').trim().toLowerCase();
      const canonicalAns = ['true', 'صح', 'صحيح', 'صواب', '1'].includes(ansLower)
        ? 'True'
        : ['false', 'خطأ', 'خاطئ', 'غير صحيح', '0'].includes(ansLower)
          ? 'False'
          : rawAns;
      return { options: rewrapOpts(tfAr), optionsEn: rewrapOpts(tfEn), correctAnswer: canonicalAns, correctAnswerEn: canonicalAns };
    }

    const arOpts = disambiguateTranslatedOptions(rawOpts, rawOpts.map((o) => collector.get(o, 'content')));
    if (Array.isArray(rawAns)) {
      const arAns = rawAns.map((a: any) => {
        const str = String(a ?? '');
        const idx = resolveOptionIndex(str, rawOpts);
        return idx >= 0 ? arOpts[idx] : collector.get(str, 'content');
      });
      return { options: rewrapOpts(arOpts), optionsEn: rewrapOpts(rawOpts), correctAnswer: rewrapAns(arAns), correctAnswerEn: rewrapAns(rawAns) };
    }

    const ansStr = String(rawAns ?? '');
    if (
      itemType.toUpperCase() === 'MULTI_SELECT' &&
      /[,،|;]/.test(ansStr) &&
      !rawOpts.some((o) => normalizeChoiceMatch(o, ansStr))
    ) {
      const parts = ansStr.split(/[,،|;]/).map((s) => s.trim()).filter(Boolean);
      const arParts = parts.map((p) => {
        const idx = resolveOptionIndex(p, rawOpts);
        return idx >= 0 ? arOpts[idx] : collector.get(p, 'content');
      });
      const enParts = parts.map((p) => {
        const idx = resolveOptionIndex(p, rawOpts);
        return idx >= 0 ? rawOpts[idx] : p;
      });
      return {
        options: rewrapOpts(arOpts),
        optionsEn: rewrapOpts(rawOpts),
        correctAnswer: JSON.stringify(arParts),
        correctAnswerEn: JSON.stringify(enParts),
      };
    }

    const idx = resolveOptionIndex(ansStr, rawOpts);
    const matchedByText = idx >= 0 && normalizeChoiceMatch(rawOpts[idx], ansStr);
    const arAns =
      idx >= 0
        ? (!matchedByText && /^[A-F]$/i.test(ansStr.trim()) ? ansStr.trim().toUpperCase() : arOpts[idx])
        : (/^[A-F]$/i.test(ansStr.trim()) ? ansStr.trim().toUpperCase() : collector.get(ansStr, 'content'));
    return {
      options: rewrapOpts(arOpts),
      optionsEn: rewrapOpts(rawOpts),
      correctAnswer: arAns,
      correctAnswerEn: idx >= 0 && /^[1-9]$/.test(ansStr.trim()) && !matchedByText ? rawOpts[idx] : rawAns,
    };
  }

  let translatedOpts = rawOpts;
  if (Array.isArray(rawOpts)) {
    translatedOpts = rawOpts.map((entry) => {
      if (!entry || typeof entry !== 'object') return entry;
      const next = { ...entry };
      for (const k of INTERACTIVE_OBJECT_KEYS) {
        if (typeof next[k] === 'string') next[k] = collector.get(next[k], 'content');
      }
      return next;
    });
  } else if (rawOpts && typeof rawOpts === 'object') {
    translatedOpts = { ...rawOpts };
    for (const arrKey of ['left', 'right', 'groups', 'choices', 'words'] as const) {
      if (Array.isArray(rawOpts[arrKey])) {
        translatedOpts[arrKey] = rawOpts[arrKey].map((v: any) => (typeof v === 'string' ? collector.get(v, 'content') : v));
      }
    }
    if (typeof rawOpts.sentence === 'string') translatedOpts.sentence = collector.get(rawOpts.sentence, 'content');
    if (typeof rawOpts.prompt === 'string') translatedOpts.prompt = collector.get(rawOpts.prompt, 'content');
    if (Array.isArray(rawOpts.items)) {
      translatedOpts.items = rawOpts.items.map((item: any) => {
        if (typeof item === 'string') return collector.get(item, 'content');
        if (!item || typeof item !== 'object') return item;
        return {
          ...item,
          ...(typeof item.text === 'string' ? { text: collector.get(item.text, 'content') } : {}),
          ...(typeof item.group === 'string' ? { group: collector.get(item.group, 'content') } : {}),
          ...(typeof item.label === 'string' ? { label: collector.get(item.label, 'content') } : {}),
        };
      });
    }
    if (Array.isArray(rawOpts.pairs)) {
      translatedOpts.pairs = rawOpts.pairs.map((pair: any) => {
        if (!pair || typeof pair !== 'object') return pair;
        return {
          ...pair,
          ...(typeof pair.left === 'string' ? { left: collector.get(pair.left, 'content') } : {}),
          ...(typeof pair.right === 'string' ? { right: collector.get(pair.right, 'content') } : {}),
          ...(typeof pair.text === 'string' ? { text: collector.get(pair.text, 'content') } : {}),
        };
      });
    }
  }

  let translatedAns = rawAns;
  if (Array.isArray(rawAns)) {
    translatedAns = rawAns.map((v: any) => (typeof v === 'string' ? collector.get(v, 'content') : v));
  } else if (rawAns && typeof rawAns === 'object') {
    const objAns: Record<string, any> = {};
    for (const [k, v] of Object.entries(rawAns)) {
      const tk = collector.get(k, 'content');
      objAns[tk] = typeof v === 'string' ? collector.get(v, 'content') : v;
    }
    translatedAns = objAns;
  } else if (typeof rawAns === 'string') {
    translatedAns = collector.get(rawAns, 'content');
  }

  return {
    options: rewrapOpts(translatedOpts),
    correctAnswer: rewrapAns(translatedAns),
  };
}

function collectItemStrings(item: any, collector: TranslationCollector): void {
  if (!item || typeof item !== 'object') return;
  for (const [arKey, enKey, kind] of ITEM_FIELD_PAIRS) {
    collectLocalizedPair(item[arKey], item[enKey], collector, kind);
  }
  if (item.metadata && typeof item.metadata === 'object') {
    for (const [arKey, enKey, kind] of METADATA_ONLY_PAIRS) {
      collectLocalizedPair(item.metadata[arKey], item.metadata[enKey], collector, kind);
    }
  }
  if (Array.isArray(item.sections)) {
    for (const sec of item.sections) {
      collectLocalizedPair(sec?.content ?? sec?.text, sec?.contentEn ?? sec?.textEn, collector, 'content');
    }
  }
  const hasEnOpts = item.optionsEn !== undefined && item.optionsEn !== null && !(Array.isArray(item.optionsEn) && item.optionsEn.length === 0);
  const srcOpts = hasEnOpts ? item.optionsEn : item.options;
  const srcAns =
    item.correctAnswerEn !== undefined && item.correctAnswerEn !== null && item.correctAnswerEn !== ''
      ? item.correctAnswerEn
      : item.correctAnswer;
  if (srcOpts !== undefined || srcAns !== undefined) {
    collectInteractiveStrings(srcOpts, srcAns, collector, String(item.type || item.label || ''));
  }
  if (Array.isArray(item.correctAnswersEn) && item.correctAnswersEn.length) {
    item.correctAnswersEn.forEach((v: unknown) => collector.add(v, 'content'));
  } else if (Array.isArray(item.correctAnswers) && item.correctAnswers.length) {
    item.correctAnswers.forEach((v: unknown) => collector.add(v, 'content'));
  }
}

function applyItemTranslations(item: any, collector: TranslationCollector, isQuestionOrSlide = true): any {
  if (!item || typeof item !== 'object') return item;
  const next = { ...item };

  for (const [arKey, enKey, kind] of ITEM_FIELD_PAIRS) {
    if (next[arKey] === undefined && next[enKey] === undefined) continue;
    const { ar, en } = applyLocalizedPair(next[arKey], next[enKey], collector, kind);
    if (next[arKey] !== undefined || ar) next[arKey] = ar;
    if (en) next[enKey] = en;
  }

  // Keep slide content/text and contentEn/textEn aligned when one mirrors the other.
  if (next.content !== undefined && next.text === next.contentEn && hasArabicVisibleText(next.content)) {
    next.text = next.content;
  }
  if (next.contentEn && !next.textEn && next.text !== undefined) {
    next.textEn = next.contentEn;
  }

  if (Array.isArray(next.sections)) {
    next.sections = next.sections.map((sec: any) => {
      if (!sec || typeof sec !== 'object') return sec;
      const { ar, en } = applyLocalizedPair(sec.content ?? sec.text, sec.contentEn ?? sec.textEn, collector, 'content');
      return {
        ...sec,
        content: ar,
        ...(en ? { contentEn: en } : {}),
      };
    });
    const expSec = next.sections.find((s: any) => s?.type === 'EXPLANATION');
    if (expSec && !hasArabicVisibleText(next.explanation) && hasArabicVisibleText(expSec.content)) {
      next.explanation = expSec.content;
      if (expSec.contentEn && !next.explanationEn) next.explanationEn = expSec.contentEn;
    }
  }

  if (next.metadata && typeof next.metadata === 'object') {
    const nextMeta = { ...next.metadata };
    for (const [arKey, enKey, kind] of METADATA_ONLY_PAIRS) {
      if (nextMeta[arKey] === undefined && nextMeta[enKey] === undefined && next[arKey] === undefined) continue;
      const { ar, en } = applyLocalizedPair(nextMeta[arKey] ?? next[arKey], nextMeta[enKey] ?? next[enKey], collector, kind);
      if (ar) nextMeta[arKey] = ar;
      if (en) nextMeta[enKey] = en;
      if (ar && (next[arKey] === undefined || !hasArabicVisibleText(next[arKey]))) next[arKey] = ar;
      if (en && !next[enKey]) next[enKey] = en;
    }
    next.metadata = nextMeta;
  }

  if (!isQuestionOrSlide) return next;

  const optsArHasArabic = Array.isArray(next.options)
    ? next.options.some((o: any) => hasArabicVisibleText(typeof o === 'string' ? o : JSON.stringify(o ?? '')))
    : hasArabicVisibleText(typeof next.options === 'string' ? next.options : JSON.stringify(next.options ?? ''));
  const hasEnOpts = next.optionsEn !== undefined && next.optionsEn !== null && !(Array.isArray(next.optionsEn) && next.optionsEn.length === 0);

  if (!optsArHasArabic && (hasEnOpts || next.options !== undefined)) {
    const sourceOpts = hasEnOpts ? next.optionsEn : next.options;
    const sourceAns =
      next.correctAnswerEn !== undefined && next.correctAnswerEn !== null && next.correctAnswerEn !== ''
        ? next.correctAnswerEn
        : next.correctAnswer;
    const tr = translateInteractivePayload(sourceOpts, sourceAns, collector, String(next.type || next.label || ''));
    if (tr.options !== undefined) next.options = tr.options;
    if (!hasEnOpts && sourceOpts !== undefined && tr.options !== undefined && JSON.stringify(tr.options) !== JSON.stringify(sourceOpts)) {
      next.optionsEn = sourceOpts;
    }
    if (tr.optionsEn !== undefined && (next.optionsEn === undefined || next.optionsEn === null)) {
      next.optionsEn = tr.optionsEn;
    }
    if (tr.correctAnswer !== undefined) next.correctAnswer = tr.correctAnswer;
    if ((next.correctAnswerEn === undefined || next.correctAnswerEn === null || next.correctAnswerEn === '') && tr.correctAnswerEn !== undefined) {
      next.correctAnswerEn = tr.correctAnswerEn;
    } else if ((next.correctAnswerEn === undefined || next.correctAnswerEn === null) && sourceAns !== undefined && JSON.stringify(tr.correctAnswer) !== JSON.stringify(sourceAns)) {
      next.correctAnswerEn = sourceAns;
    }
  }

  if (Array.isArray(next.correctAnswers) || Array.isArray(next.correctAnswersEn)) {
    const arHasAr = Array.isArray(next.correctAnswers) && next.correctAnswers.some((v: any) => hasArabicVisibleText(String(v ?? '')));
    if (!arHasAr) {
      const sourceMulti =
        Array.isArray(next.correctAnswersEn) && next.correctAnswersEn.length
          ? next.correctAnswersEn
          : next.correctAnswers;
      if (Array.isArray(sourceMulti) && sourceMulti.length) {
        const arOpts: string[] = Array.isArray(next.options) ? next.options.map(String) : [];
        const enOpts: string[] = Array.isArray(next.optionsEn) ? next.optionsEn.map(String) : [];
        const mappedMulti = sourceMulti.map((ans: any) => {
          const idx = enOpts.findIndex((o: string) => normalizeChoiceMatch(o, ans));
          if (idx >= 0 && arOpts[idx]) return arOpts[idx];
          return collector.get(String(ans ?? ''), 'content');
        });
        if (!Array.isArray(next.correctAnswersEn) || !next.correctAnswersEn.length) {
          next.correctAnswersEn = [...sourceMulti];
        }
        next.correctAnswers = mappedMulti;
        next.correctAnswer = Array.isArray(next.correctAnswer) ? mappedMulti : JSON.stringify(mappedMulti);
      }
    }
  }

  return next;
}

export async function autoTranslateLessonMetadata(metadata: Record<string, any>): Promise<Record<string, any>> {
  if (!metadata || typeof metadata !== 'object') return metadata;
  const collector = new TranslationCollector();

  for (const [arKey, enKey, kind] of LESSON_METADATA_SINGLE_FIELDS) {
    collectLocalizedPair(metadata[arKey], metadata[enKey], collector, kind);
  }
  for (const [arKey, enKey, kind] of LESSON_METADATA_LIST_FIELDS) {
    collectLocalizedPair(metadata[arKey], metadata[enKey], collector, kind, true);
  }

  if (!(await collector.flush())) return metadata;

  const next: Record<string, any> = { ...metadata };
  for (const [arKey, enKey, kind] of LESSON_METADATA_SINGLE_FIELDS) {
    if (next[arKey] === undefined && next[enKey] === undefined) continue;
    const { ar, en } = applyLocalizedPair(next[arKey], next[enKey], collector, kind);
    if (next[arKey] !== undefined || ar) next[arKey] = ar;
    if (en) next[enKey] = en;
  }
  for (const [arKey, enKey, kind] of LESSON_METADATA_LIST_FIELDS) {
    if (next[arKey] === undefined && next[enKey] === undefined) continue;
    const { ar, en } = applyLocalizedPair(next[arKey], next[enKey], collector, kind, true);
    if (next[arKey] !== undefined || ar) next[arKey] = ar;
    if (en) next[enKey] = en;
  }
  return next;
}

export async function autoTranslateSlidesList(slides: any[]): Promise<any[]> {
  if (!Array.isArray(slides) || slides.length === 0) return slides;
  const collector = new TranslationCollector();
  slides.forEach((slide) => collectItemStrings(slide, collector));
  if (!(await collector.flush())) return slides;
  return slides.map((slide) => applyItemTranslations(slide, collector, true));
}

export async function autoTranslateQuestionsList(questions: any[]): Promise<any[]> {
  if (!Array.isArray(questions) || questions.length === 0) return questions;
  const collector = new TranslationCollector();
  questions.forEach((question) => collectItemStrings(question, collector));
  if (!(await collector.flush())) return questions;
  return questions.map((question) => applyItemTranslations(question, collector, true));
}

export async function autoTranslateLessonWorkbook(lesson: Record<string, any>): Promise<Record<string, any>> {
  if (!lesson || typeof lesson !== 'object') return lesson;
  const collector = new TranslationCollector();

  for (const [arKey, enKey, kind] of LESSON_METADATA_SINGLE_FIELDS) {
    collectLocalizedPair(lesson[arKey], lesson[enKey], collector, kind);
  }
  for (const [arKey, enKey, kind] of LESSON_METADATA_LIST_FIELDS) {
    collectLocalizedPair(lesson[arKey], lesson[enKey], collector, kind, true);
  }

  const slides = Array.isArray(lesson.slides) ? lesson.slides : [];
  const assignments = Array.isArray(lesson.assignments) ? lesson.assignments : [];
  const questions = Array.isArray(lesson.questions) ? lesson.questions : [];
  slides.forEach((s: any) => collectItemStrings(s, collector));
  assignments.forEach((a: any) => collectItemStrings(a, collector));
  questions.forEach((q: any) => collectItemStrings(q, collector));

  if (!(await collector.flush())) return lesson;

  const next: Record<string, any> = { ...lesson };
  for (const [arKey, enKey, kind] of LESSON_METADATA_SINGLE_FIELDS) {
    if (next[arKey] === undefined && next[enKey] === undefined) continue;
    const { ar, en } = applyLocalizedPair(next[arKey], next[enKey], collector, kind);
    if (next[arKey] !== undefined || ar) next[arKey] = ar;
    if (en) next[enKey] = en;
  }
  for (const [arKey, enKey, kind] of LESSON_METADATA_LIST_FIELDS) {
    if (next[arKey] === undefined && next[enKey] === undefined) continue;
    const { ar, en } = applyLocalizedPair(next[arKey], next[enKey], collector, kind, true);
    if (next[arKey] !== undefined || ar) next[arKey] = ar;
    if (en) next[enKey] = en;
  }

  if (Array.isArray(lesson.slides)) {
    next.slides = lesson.slides.map((s: any) => applyItemTranslations(s, collector, true));
  }
  if (Array.isArray(lesson.assignments)) {
    next.assignments = lesson.assignments.map((a: any) => applyItemTranslations(a, collector, true));
  }
  if (Array.isArray(lesson.questions)) {
    next.questions = lesson.questions.map((q: any) => applyItemTranslations(q, collector, true));
  }
  return next;
}

export async function autoTranslateSkillMetadata(metadata: Record<string, any>): Promise<Record<string, any>> {
  if (!metadata || typeof metadata !== 'object') return metadata;
  const collector = new TranslationCollector();
  const listKeys = ['standards', 'indicators', 'outcomes'] as const;

  for (const key of listKeys) {
    const items = Array.isArray(metadata[key]) ? metadata[key] : [];
    for (const item of items) {
      if (isEnglishWithoutArabic(item, 'metadata')) {
        collector.add(item, 'metadata');
      }
    }
  }
  if (metadata.domain !== undefined || metadata.domainEn !== undefined) {
    collectLocalizedPair(metadata.domain, metadata.domainEn, collector, 'metadata');
  }

  if (!(await collector.flush())) return metadata;

  const nextTranslations: Record<string, string> = { ...(metadata.translations || {}) };
  const next: Record<string, any> = { ...metadata };

  for (const key of listKeys) {
    if (!Array.isArray(metadata[key])) continue;
    const translatedList: string[] = [];
    for (const item of metadata[key]) {
      const raw = String(item ?? '').trim();
      if (!raw) continue;
      if (isEnglishWithoutArabic(raw, 'metadata')) {
        const ar = collector.get(raw, 'metadata');
        const pairedEn = nextTranslations[raw] || raw;
        translatedList.push(ar);
        if (ar && pairedEn && ar !== pairedEn) {
          nextTranslations[ar] = pairedEn;
        }
      } else {
        translatedList.push(raw);
      }
    }
    next[key] = Array.from(new Set(translatedList));
  }

  if (metadata.domain !== undefined || metadata.domainEn !== undefined) {
    const { ar, en } = applyLocalizedPair(metadata.domain, metadata.domainEn, collector, 'metadata');
    if (ar) next.domain = ar;
    if (en) next.domainEn = en;
  }

  next.translations = nextTranslations;
  return next;
}

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function mergeTranslatedQuestionMetadata(liveQuestions: any[], translatedImported: any[]): any[] {
  if (!Array.isArray(liveQuestions) || !Array.isArray(translatedImported) || translatedImported.length === 0) {
    return liveQuestions;
  }
  const translatedById = new Map<string, any>();
  translatedImported.forEach((q, idx) => {
    const key = q?.id !== undefined && q?.id !== null && String(q.id).trim() ? String(q.id) : `__idx_${idx}`;
    translatedById.set(key, q);
  });

  return liveQuestions.map((q, idx) => {
    const lookupKey = q?.id !== undefined && q?.id !== null && String(q.id).trim() ? String(q.id) : `__idx_${idx}`;
    const tr = translatedById.get(lookupKey) ?? translatedImported[idx];
    if (!tr || typeof tr !== 'object') return q;
    const next = { ...q };
    for (const [arKey, enKey] of METADATA_ONLY_PAIRS) {
      if (tr[arKey] !== undefined && tr[arKey] !== '') next[arKey] = tr[arKey];
      if (tr[enKey] !== undefined && tr[enKey] !== '') next[enKey] = tr[enKey];
    }
    if (tr.dok !== undefined) next.dok = tr.dok;
    if (tr.difficulty !== undefined) next.difficulty = tr.difficulty;
    return next;
  });
}

export async function importLessonMetadataFromExcelFile(file: File, title = ''): Promise<Record<string, any>> {
  const [XLSX, { parseLessonMetadataRows }] = await Promise.all([
    import('xlsx'),
    import('./lessonMetadataExcel'),
  ]);
  const buffer = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(buffer, { type: 'array' });
  const targetSheet = workbook.Sheets.Metadata || workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(targetSheet, { header: 1, defval: '' });
  if (rows.length < 2) {
    throw new Error('الملف فارغ أو لا يحتوي على صفوف بيانات / File is empty or does not contain data rows');
  }
  const parsed = parseLessonMetadataRows(rows, title);
  return autoTranslateLessonMetadata(parsed);
}
