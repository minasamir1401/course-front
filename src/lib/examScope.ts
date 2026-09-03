type ExamScopeSource = {
  isCentral?: boolean | null;
  schoolId?: string | null;
  schoolIds?: string[] | null;
  schools?: Array<{ id?: string | null } | string> | null;
};

function uniqueIds(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

export function resolveExamSchoolIds(source: ExamScopeSource, fallbackSchoolId?: string | null) {
  const relatedSchoolIds = Array.isArray(source?.schools)
    ? source.schools.map((school) => typeof school === "string" ? school : school?.id)
    : [];

  return uniqueIds([
    ...(Array.isArray(source?.schoolIds) ? source.schoolIds : []),
    source?.schoolId,
    ...relatedSchoolIds,
    fallbackSchoolId,
  ]);
}

export function resolveExamEditScope(source: ExamScopeSource, fallbackSchoolId?: string | null) {
  const schoolIds = resolveExamSchoolIds(source, fallbackSchoolId);
  const isCentral = source?.isCentral === true || schoolIds.length === 0;

  return {
    isCentral,
    schoolIds: isCentral ? [] : schoolIds,
  };
}
