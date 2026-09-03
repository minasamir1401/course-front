export type ExamCreationRole = "SUPER_ADMIN" | "SCHOOL_ADMIN";

export function isModuleCreationMode(
  role: ExamCreationRole,
  pathname: string,
  requestedMode: string | null,
): boolean {
  if (requestedMode === "module") return true;
  if (requestedMode === "exam") return false;

  const expectedPath = role === "SUPER_ADMIN" ? "/super-admin/exams/new" : "/school-admin/exams/new";
  return pathname === expectedPath;
}
