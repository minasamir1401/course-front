const isPersistedId = (id: unknown): id is string => typeof id === 'string' && id.length > 20;

function normalizeQuestionText(text: unknown): string {
  if (!text) return '';
  return String(text)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/[−–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/^(question|سؤال|q)\s*\d+(\s*\([^)]*\))?[:.\s-]*/i, '')
    .trim();
}

function normalizeQuestionOptions(options: unknown): string {
  if (!options) return '';
  if (Array.isArray(options)) {
    return options
      .map((opt) => {
        if (typeof opt === 'object' && opt !== null) {
          return normalizeQuestionText(opt.text || opt.title || opt.content || '');
        }
        return normalizeQuestionText(opt);
      })
      .filter(Boolean)
      .sort()
      .join('|');
  }
  return normalizeQuestionText(options);
}

type BuildDraftModulesArgs = {
  modules: any[];
  currentModule: any;
  editingModuleIndex: number | null;
  isModuleModalOpen: boolean;
  moduleMode?: boolean;
};

type BuildExamSubmissionPayloadArgs = {
  modules: any[];
  standaloneQuestions?: any[];
};

export function deduplicateModules(modules: any[]) {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const result: any[] = [];

  for (const m of (Array.isArray(modules) ? modules : [])) {
    if (!m) continue;
    const id = m.id ? String(m.id).trim() : '';
    const title = m.title ? String(m.title).trim().toLowerCase() : '';

    if (id && seenIds.has(id)) continue;
    if (title && seenTitles.has(title)) continue;

    if (id) seenIds.add(id);
    if (title) seenTitles.add(title);
    result.push(m);
  }

  return result;
}

export function buildDraftModules({
  modules,
  currentModule,
  editingModuleIndex,
  isModuleModalOpen,
  moduleMode,
}: BuildDraftModulesArgs) {
  const finalModules = Array.isArray(modules) ? [...modules] : [];
  const hasCurrentModule = !!currentModule?.title || !!currentModule?.id;
  if (!hasCurrentModule) return deduplicateModules(finalModules);

  const matchedIndex = editingModuleIndex !== null
    ? editingModuleIndex
    : finalModules.findIndex((module) => {
        if (module?.id && currentModule?.id && String(module.id) === String(currentModule.id)) return true;
        if (module?.title && currentModule?.title && String(module.title).trim() === String(currentModule.title).trim()) return true;
        return false;
      });

  if (matchedIndex >= 0 && matchedIndex < finalModules.length) {
    finalModules[matchedIndex] = { ...finalModules[matchedIndex], ...currentModule };
  } else if (isModuleModalOpen || (moduleMode && finalModules.length === 0)) {
    finalModules.push(currentModule);
  }

  return deduplicateModules(finalModules);
}

export function buildModulesSubmissionPayload(modules: any[]) {
  const allQuestions: any[] = [];
  const modulesPayload = (Array.isArray(modules) ? modules : []).map((moduleItem: any, moduleIndex: number) => {
    const moduleId = moduleItem.id || String(Date.now() + moduleIndex);
    const subExams = (moduleItem.subExams || []).map((subExam: any, subExamIndex: number) => {
      const subExamId = subExam.id || String(Date.now() + moduleIndex * 1000 + subExamIndex);
      const subExamQuestions = (subExam.questions || []).map((question: any) => ({
        ...question,
        moduleId,
        subExamId,
      }));
      allQuestions.push(...subExamQuestions);

      return {
        id: subExamId,
        title: subExam.title,
        password: subExam.password || null,
        duration: subExam.duration || null,
        passingScore: subExam.passingScore || null,
        attemptsAllowed: subExam.attemptsAllowed === "" || subExam.attemptsAllowed === undefined || subExam.attemptsAllowed === null ? 999 : Number(subExam.attemptsAllowed),
        publishDate: subExam.publishDate || null,
        cutOffDate: subExam.cutOffDate || null,
        order: subExamIndex,
      };
    });

    const moduleQuestions = (moduleItem.questions || []).map((question: any) => ({
      ...question,
      moduleId,
    }));
    allQuestions.push(...moduleQuestions);

    const subModules = (moduleItem.subModules || []).map((subModuleItem: any, subModuleIndex: number) => {
      const subModuleId = subModuleItem.id || String(Date.now() + moduleIndex * 10000 + subModuleIndex * 100);
      const subModSubExams = (subModuleItem.subExams || []).map((subExam: any, subExamIndex: number) => {
        const subExamId = subExam.id || String(Date.now() + moduleIndex * 10000 + subModuleIndex * 100 + subExamIndex + 1);
        const subExamQuestions = (subExam.questions || []).map((question: any) => ({
          ...question,
          moduleId: subModuleId,
          subExamId,
        }));
        allQuestions.push(...subExamQuestions);

        return {
          id: subExamId,
          title: subExam.title,
          password: subExam.password || null,
          duration: subExam.duration || null,
          passingScore: subExam.passingScore || null,
          attemptsAllowed: subExam.attemptsAllowed === "" || subExam.attemptsAllowed === undefined || subExam.attemptsAllowed === null ? 999 : Number(subExam.attemptsAllowed),
          publishDate: subExam.publishDate || null,
          cutOffDate: subExam.cutOffDate || null,
          order: subExamIndex,
        };
      });

      const subModuleQuestions = (subModuleItem.questions || []).map((question: any) => ({
        ...question,
        moduleId: subModuleId,
      }));
      allQuestions.push(...subModuleQuestions);

      return {
        id: subModuleId,
        title: subModuleItem.title,
        description: subModuleItem.content || subModuleItem.description || null,
        duration: subModuleItem.duration || null,
        passingScore: subModuleItem.passingScore || null,
        publishDate: subModuleItem.publishDate || null,
        cutOffDate: subModuleItem.cutOffDate || null,
        order: subModuleIndex,
        subExams: subModSubExams,
      };
    });

    return {
      id: moduleId,
      title: moduleItem.title,
      description: moduleItem.content || moduleItem.description || null,
      duration: moduleItem.duration || null,
      passingScore: moduleItem.passingScore || null,
      publishDate: moduleItem.publishDate || null,
      cutOffDate: moduleItem.cutOffDate || null,
      order: moduleIndex,
      subExams,
      subModules,
    };
  });

  return { modulesPayload, allQuestions };
}

export function getQuestionContentSignature(q: any): string {
  if (!q) return '';
  const rawText = normalizeQuestionText(q.text || q.content || '');
  const rawTextEn = normalizeQuestionText(q.textEn || '');
  const combinedText = (rawText || rawTextEn).trim();
  const mediaKey = String(q.imageUrl || q.videoUrl || '').trim();
  const optionsKey = normalizeQuestionOptions(q.options);
  return `${combinedText}##${optionsKey}##${mediaKey}`;
}

export function pruneDuplicateStandaloneQuestions(
  standaloneQuestions: any[],
  moduleQuestions: any[],
): any[] {
  const moduleSigs = new Set<string>();
  const moduleIds = new Set<string>();

  for (const q of (Array.isArray(moduleQuestions) ? moduleQuestions : [])) {
    if (!q) continue;
    if (isPersistedId(q.id)) moduleIds.add(q.id);
    const sig = getQuestionContentSignature(q);
    if (sig && sig !== '##') moduleSigs.add(sig);
  }

  const seenStandaloneSigs = new Set<string>();
  const result: any[] = [];

  for (const sq of (Array.isArray(standaloneQuestions) ? standaloneQuestions : [])) {
    if (!sq) continue;
    if (isPersistedId(sq.id) && moduleIds.has(sq.id)) continue;
    const sig = getQuestionContentSignature(sq);

    // Drop standalone copy if identical question exists in any module
    if (sig && sig !== '##' && moduleSigs.has(sig)) continue;
    // Deduplicate within standalone itself
    if (sig && sig !== '##' && seenStandaloneSigs.has(sig)) continue;

    if (sig && sig !== '##') seenStandaloneSigs.add(sig);
    result.push(sq);
  }

  return result;
}

export function deduplicateSubmissionQuestions(questions: any[]) {
  const seenIds = new Set<string>();
  const seenModuleSignatures = new Set<string>();
  const seenScopeKeys = new Set<string>();
  const result: any[] = [];

  for (const q of (Array.isArray(questions) ? questions : [])) {
    if (!q) continue;
    const rawText = normalizeQuestionText(q.text || q.content || '');
    const rawTextEn = normalizeQuestionText(q.textEn || '');
    const hasMedia = Boolean((q.imageUrl && String(q.imageUrl).trim()) || (q.videoUrl && String(q.videoUrl).trim()));

    // Skip empty items with neither text nor media
    if (rawText.length < 2 && rawTextEn.length < 2 && !hasMedia) continue;

    const fullContentSig = getQuestionContentSignature(q);
    const isStandalone = !q.moduleId && !q.subExamId;
    const scopeKey = `${q.moduleId || 'standalone'}:${q.subExamId || 'none'}:${fullContentSig}`;

    const id = isPersistedId(q.id) ? q.id : null;
    if (id) {
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      if (!isStandalone && fullContentSig) {
        seenModuleSignatures.add(fullContentSig);
      }
      seenScopeKeys.add(scopeKey);
      result.push(q);
      continue;
    }

    // For non-persisted questions:
    // Standalone vs Module: Drop standalone question if its content exists in a module
    if (isStandalone && fullContentSig && seenModuleSignatures.has(fullContentSig)) {
      continue;
    }

    // Deduplicate within the same module/scope (keeps different modules separate)
    if (seenScopeKeys.has(scopeKey)) {
      continue;
    }

    if (!isStandalone && fullContentSig) {
      seenModuleSignatures.add(fullContentSig);
    }
    seenScopeKeys.add(scopeKey);
    result.push(q);
  }

  return result;
}

export function buildExamSubmissionPayload({
  modules,
  standaloneQuestions = [],
}: BuildExamSubmissionPayloadArgs) {
  const { modulesPayload, allQuestions } = buildModulesSubmissionPayload(modules);
  const cleanedStandalone = pruneDuplicateStandaloneQuestions(standaloneQuestions, allQuestions);
  const standalonePayload = cleanedStandalone.map((question: any) => ({
    ...question,
    moduleId: null,
    subExamId: null,
  }));

  const rawCombined = [...allQuestions, ...standalonePayload];

  return {
    modulesPayload,
    allQuestions: deduplicateSubmissionQuestions(rawCombined),
    cleanedStandaloneQuestions: cleanedStandalone,
  };
}
