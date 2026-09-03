export type ModuleCreationView = "full-builder" | "module-setup" | "module-summary";
export type ModuleCreationRole = "SUPER_ADMIN" | "SCHOOL_ADMIN";

export function getModuleCreationView(isModuleMode: boolean, moduleCount: number): ModuleCreationView {
  if (!isModuleMode) return "full-builder";
  return moduleCount > 0 ? "module-summary" : "module-setup";
}

export function buildCreatedModulePortalHref(
  role: ModuleCreationRole,
  examId: string | null | undefined,
  submittedModules: Array<{ id?: string | null; title?: string | null }>,
  responseExam: { id?: string | null; modules?: Array<{ id?: string | null; title?: string | null }> } | null | undefined,
): string | null {
  const resolvedExamId = String(responseExam?.id || examId || "").trim();
  if (!resolvedExamId) return null;

  const createdModules = Array.isArray(responseExam?.modules) ? responseExam!.modules! : [];
  if (createdModules.length === 0) return null;

  const firstSubmitted = submittedModules[0];
  const matchingCreatedModule = createdModules.find((module) => {
    const responseTitle = String(module?.title || "").trim();
    const submittedTitle = String(firstSubmitted?.title || "").trim();
    return Boolean(responseTitle && submittedTitle && responseTitle === submittedTitle);
  });

  const resolvedModuleId = String(matchingCreatedModule?.id || createdModules[0]?.id || "").trim();
  if (!resolvedModuleId) return null;

  const basePath = role === "SCHOOL_ADMIN" ? "/school-admin" : "/super-admin";
  return `${basePath}/exams/edit/${encodeURIComponent(resolvedExamId)}?moduleId=${encodeURIComponent(resolvedModuleId)}`;
}
