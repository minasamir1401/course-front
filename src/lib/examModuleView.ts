export type ExamModuleView = {
  id: string;
  parentExamId: string;
  title: string;
  description?: string | null;
  grade?: string | null;
  isCentral?: boolean;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  examsCount: number;
  questionsCount: number;
};

export type ExamWorkflowView = 'full-editor' | 'module-portal' | 'sub-exam-editor';
export type ExamWorkflowRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN';

export function getExamWorkflowView(moduleId?: string | null, subExamId?: string | null): ExamWorkflowView {
  if (moduleId && subExamId) {
    return 'sub-exam-editor';
  }

  if (moduleId) {
    return 'module-portal';
  }

  return 'full-editor';
}

export function shouldRenderModulePortal(moduleId?: string | null, subExamId?: string | null): boolean {
  return getExamWorkflowView(moduleId, subExamId) === 'module-portal';
}

export function buildSubExamEditorHref(
  role: ExamWorkflowRole,
  parentExamId?: string | null,
  moduleId?: string | null,
  subExamId?: string | null,
): string | null {
  if (!parentExamId || !moduleId || !subExamId) {
    return null;
  }

  const basePath = role === 'SUPER_ADMIN' ? '/super-admin/exams/edit' : '/school-admin/exams/edit';
  const params = new URLSearchParams({
    moduleId,
    subExamId,
  });

  return `${basePath}/${encodeURIComponent(parentExamId)}?${params.toString()}`;
}

export function buildModulePortalHref(
  role: ExamWorkflowRole,
  parentExamId?: string | null,
  moduleId?: string | null,
): string | null {
  if (!parentExamId || !moduleId) {
    return null;
  }

  const basePath = role === 'SUPER_ADMIN' ? '/super-admin/exams/edit' : '/school-admin/exams/edit';
  const params = new URLSearchParams({
    moduleId,
  });

  return `${basePath}/${encodeURIComponent(parentExamId)}?${params.toString()}`;
}

export function buildModuleEditHref(
  role: ExamWorkflowRole,
  parentExamId?: string | null,
  moduleId?: string | null,
): string | null {
  if (!parentExamId || !moduleId) {
    return null;
  }

  const basePath = role === 'SUPER_ADMIN' ? '/super-admin/exams/edit' : '/school-admin/exams/edit';
  const params = new URLSearchParams({ view: 'editor' });

  return `${basePath}/${encodeURIComponent(parentExamId)}?${params.toString()}`;
}

export function getModulePortalQuestions(moduleItem: any): any[] {
  return Array.isArray(moduleItem?.questions) ? moduleItem.questions : [];
}

export function getStandaloneQuestions(state: any): any[] {
  return Array.isArray(state?.standaloneQuestions) ? state.standaloneQuestions : [];
}

export function buildModuleCardSettingsHref(
  role: ExamWorkflowRole,
  parentExamId?: string | null,
  moduleId?: string | null,
  isSyntheticModuleCard = false,
): string | null {
  if (!parentExamId) {
    return null;
  }

  if (isSyntheticModuleCard) {
    const basePath = role === 'SUPER_ADMIN' ? '/super-admin/exams/edit' : '/school-admin/exams/edit';
    return `${basePath}/${encodeURIComponent(parentExamId)}?view=editor`;
  }

  return buildModulePortalHref(role, parentExamId, moduleId);
}

export function buildPrimaryModulePortalHref(
  role: ExamWorkflowRole,
  parentExamId?: string | null,
  modules?: Array<{ id?: string | null }> | null,
): string | null {
  const firstModuleId = (Array.isArray(modules) ? modules : []).find((module) => module?.id)?.id;
  return buildModulePortalHref(role, parentExamId, firstModuleId || null);
}

export function buildExamModuleViews(exams: any[]): ExamModuleView[] {
  const views: ExamModuleView[] = [];

  for (const exam of Array.isArray(exams) ? exams : []) {
    const modules = Array.isArray(exam?.modules) ? exam.modules : [];
    const isEmptyDraft =
      String(exam?.status || '').toUpperCase() === 'DRAFT'
      && modules.length === 0
      && (exam?._count?.questions ?? exam?.questions?.length ?? 0) === 0;

    if (isEmptyDraft) {
      continue;
    }

    if (modules.length === 0 && exam?.id) {
      views.push({
        id: exam.id,
        parentExamId: exam.id,
        title: exam.title || 'Untitled Module',
        description: exam.description,
        grade: exam.grade,
        isCentral: !!exam.isCentral,
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt,
        examsCount: 0,
        questionsCount: exam._count?.questions ?? exam.questions?.length ?? 0,
      });
      continue;
    }

    for (const moduleItem of modules) {
      const subExams = Array.isArray(moduleItem?.subExams) ? moduleItem.subExams : [];
      const directQuestions = moduleItem?.questionsCount ?? moduleItem?._count?.questions ?? moduleItem?.questions?.length ?? 0;
      const childQuestions = subExams.reduce(
        (total: number, subExam: any) => total + (subExam?.questionsCount ?? subExam?._count?.questions ?? subExam?.questions?.length ?? 0),
        0,
      );
      const hasChildQuestionCounts = subExams.some((subExam: any) =>
        typeof subExam?.questionsCount === 'number'
        || typeof subExam?._count?.questions === 'number'
        || Array.isArray(subExam?.questions),
      );

      const createdAt = moduleItem.createdAt || exam.createdAt;
      const updatedAt = moduleItem.updatedAt || exam.updatedAt;
      const moduleView: ExamModuleView = {
        id: moduleItem.id,
        parentExamId: exam.id,
        title: moduleItem.title || 'Untitled Module',
        description: moduleItem.description,
        grade: exam.grade,
        isCentral: !!exam.isCentral,
        examsCount: moduleItem.examsCount ?? subExams.length,
        // New workflow owns questions on child Exams. Direct Module questions
        // are legacy content and must not inflate the Module total when Exams exist.
        questionsCount: subExams.length > 0
          ? (hasChildQuestionCounts ? childQuestions : directQuestions)
          : directQuestions,
      };

      if (createdAt) {
        moduleView.createdAt = createdAt;
      }
      if (updatedAt) {
        moduleView.updatedAt = updatedAt;
      }

      views.push(moduleView);
    }
  }

  return views;
}
