export type ExamModuleView = {
  id: string;
  parentExamId: string;
  parentModuleId?: string | null;
  title: string;
  description?: string | null;
  grade?: string | null;
  isCentral?: boolean;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  examsCount: number;
  questionsCount: number;
  subModulesCount?: number;
  subModules?: any[];
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
  const params = new URLSearchParams({ editModuleId: moduleId });

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
        parentModuleId: null,
        title: exam.title || 'Untitled Module',
        description: exam.description,
        grade: exam.grade,
        isCentral: !!exam.isCentral,
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt,
        examsCount: 0,
        questionsCount: exam._count?.questions ?? exam.questions?.length ?? 0,
        subModulesCount: 0,
        subModules: [],
      });
      continue;
    }

    for (const moduleItem of modules) {
      // In the top-level list, display root modules (parentModuleId == null).
      // Sub-modules are displayed inside their parent module in the portal.
      if (moduleItem.parentModuleId) {
        continue;
      }

      const subModules = Array.isArray(moduleItem?.subModules) ? moduleItem.subModules : [];
      const subExams = Array.isArray(moduleItem?.subExams) ? moduleItem.subExams : [];
      const directQuestions = moduleItem?.questionsCount ?? moduleItem?._count?.questions ?? moduleItem?.questions?.length ?? 0;
      
      let childQuestions = subExams.reduce(
        (total: number, subExam: any) => total + (subExam?.questionsCount ?? subExam?._count?.questions ?? subExam?.questions?.length ?? 0),
        0,
      );
      let totalExamsCount = moduleItem.examsCount ?? subExams.length;

      // Include recursive counts from direct subModules
      for (const sm of subModules) {
        const smSubExams = Array.isArray(sm?.subExams) ? sm.subExams : [];
        totalExamsCount += sm.examsCount ?? smSubExams.length;
        childQuestions += smSubExams.reduce(
          (total: number, se: any) => total + (se?.questionsCount ?? se?._count?.questions ?? se?.questions?.length ?? 0),
          0,
        );
      }

      const hasChildQuestionCounts = subExams.some((subExam: any) =>
        typeof subExam?.questionsCount === 'number'
        || typeof subExam?._count?.questions === 'number'
        || Array.isArray(subExam?.questions),
      ) || subModules.length > 0;

      const createdAt = moduleItem.createdAt || exam.createdAt;
      const updatedAt = moduleItem.updatedAt || exam.updatedAt;
      const moduleView: ExamModuleView = {
        id: moduleItem.id,
        parentExamId: exam.id,
        parentModuleId: moduleItem.parentModuleId || null,
        title: moduleItem.title || 'Untitled Module',
        description: moduleItem.description,
        grade: exam.grade,
        isCentral: !!exam.isCentral,
        examsCount: totalExamsCount,
        questionsCount: totalExamsCount > 0
          ? (hasChildQuestionCounts ? childQuestions : directQuestions)
          : directQuestions,
        subModulesCount: subModules.length,
        subModules: subModules,
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
