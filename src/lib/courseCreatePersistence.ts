import { lessonTranslationPayload } from "./bilingualMetadata";
import { parseEgyptDate } from "./egyptTime";

export type CourseCreateRole = "SUPER_ADMIN" | "SCHOOL_ADMIN";

export function toSafeCourseDateIso(value: any): string | null {
  if (value === undefined || value === null || value === "") return null;
  try {
    return parseEgyptDate(String(value)).toISOString();
  } catch {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
  }
}

export function parseLessonJsonArray(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function serializeJsonArrayField(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("[")) return value;
  }
  return "[]";
}

export function serializeCourseLessonForSave(lesson: any, index?: number) {
  return {
    ...(lesson?.id ? { id: lesson.id, expectedUpdatedAt: lesson.updatedAt } : {}),
    ...lessonTranslationPayload(lesson),
    title: lesson?.title || "",
    domain: lesson?.domain || null,
    content: lesson?.content ?? null,
    videoUrl: lesson?.videoUrl || null,
    summary: lesson?.summary || null,
    notes: lesson?.notes || null,
    standards: lesson?.standards || null,
    indicators: lesson?.indicators || null,
    learningOutcomes: lesson?.learningOutcomes || null,
    isVisible: lesson?.isVisible !== undefined ? Boolean(lesson.isVisible) : true,
    publishDate: toSafeCourseDateIso(lesson?.publishDate),
    cutOffDate: toSafeCourseDateIso(lesson?.cutOffDate),
    ...(typeof index === "number"
      ? { order: index }
      : lesson?.order !== undefined
        ? { order: lesson.order }
        : {}),
    isContentLoaded: true,
    attachments: serializeJsonArrayField(lesson?.attachments),
    slides: serializeJsonArrayField(lesson?.slides),
    questions: serializeJsonArrayField(lesson?.questions),
    assignments: serializeJsonArrayField(lesson?.assignments),
  };
}

export function buildCourseSavePayload(
  courseData: any,
  lessons: any[],
  role: CourseCreateRole
) {
  const subjects = Array.isArray(courseData?.subjects)
    ? courseData.subjects.filter(Boolean)
    : courseData?.subject
      ? [courseData.subject]
      : [];

  const grades = Array.isArray(courseData?.grades)
    ? courseData.grades.filter(Boolean)
    : courseData?.grade
      ? [courseData.grade]
      : [];

  const seenLessonIds = new Set<string>();
  const deduplicatedLessons = (Array.isArray(lessons) ? lessons : []).filter((lesson) => {
    if (!lesson?.id) return true;
    if (seenLessonIds.has(lesson.id)) return false;
    seenLessonIds.add(lesson.id);
    return true;
  });

  const sanitizedSchoolIds: string[] = Array.from(
    new Set<string>(
      (Array.isArray(courseData?.schoolIds) ? courseData.schoolIds : [])
        .map((s: any) => (typeof s === "object" && s ? s.id : s))
        .filter(
          (s: any): s is string =>
            Boolean(
              s &&
                typeof s === "string" &&
                s !== "null" &&
                s !== "undefined" &&
                s.trim() !== ""
            )
        )
        .map((s: string) => s.trim())
    )
  );

  const schoolFields =
    role === "SUPER_ADMIN"
      ? (() => {
          const isCentral =
            sanitizedSchoolIds.length === 0
              ? true
              : Boolean(courseData?.isCentral);
          return isCentral
            ? { isCentral: true, schoolIds: [] as string[], schoolId: null }
            : {
                isCentral: false,
                schoolIds: sanitizedSchoolIds,
                schoolId: sanitizedSchoolIds[0] || courseData?.schoolId || null,
              };
        })()
      : { isCentral: false };

  return {
    title: typeof courseData?.title === "string" ? courseData.title.trim() : "",
    description: courseData?.description || "",
    coverImage: courseData?.coverImage || "",
    grades,
    grade: grades[0] || "",
    subjects,
    subject: subjects.join("، "),
    country: courseData?.country || "مصر",
    ...schoolFields,
    lessons: deduplicatedLessons.map((lesson, index) =>
      serializeCourseLessonForSave(lesson, index)
    ),
  };
}

export function mergeServerSavedLessons(localLessons: any[], serverLessons: any[], submittedLessons = localLessons): any[] {
  const safeLocal = Array.isArray(localLessons) ? localLessons : [];
  if (!Array.isArray(serverLessons) || serverLessons.length === 0) {
    return safeLocal.map((lesson) => ({ ...lesson, isContentLoaded: true }));
  }

  const matchedLocalIndices = new Set<number>();

  const merged = serverLessons.map((serverLesson, idx) => {
    let matchedIndex = serverLesson?.id
      ? safeLocal.findIndex(
          (local, localIdx) =>
            !matchedLocalIndices.has(localIdx) &&
            local?.id &&
            local.id === serverLesson.id
        )
      : -1;

    if (matchedIndex === -1) {
      matchedIndex = safeLocal.findIndex(
        (local, localIdx) =>
          !matchedLocalIndices.has(localIdx) &&
          !local?.id &&
          local?.title === serverLesson?.title
      );
    }

    if (matchedIndex === -1 && idx < safeLocal.length && !matchedLocalIndices.has(idx) && !safeLocal[idx]?.id) {
      matchedIndex = idx;
    }

    const matchedLocal = matchedIndex >= 0 ? safeLocal[matchedIndex] : undefined;
    if (matchedIndex >= 0) matchedLocalIndices.add(matchedIndex);
    const submittedLesson = matchedLocal?.id
      ? submittedLessons.find(lesson => lesson.id === matchedLocal.id)
      : submittedLessons[matchedIndex];
    if (matchedLocal && matchedLocal !== submittedLesson) {
      return { ...matchedLocal, id: serverLesson.id, updatedAt: serverLesson.updatedAt, isContentLoaded: true };
    }

    const serverSlides = parseLessonJsonArray(serverLesson?.slides);
    const serverQuestions = parseLessonJsonArray(serverLesson?.questions);
    const serverAssignments = parseLessonJsonArray(serverLesson?.assignments);
    const serverAttachments = parseLessonJsonArray(serverLesson?.attachments);

    return {
      ...matchedLocal,
      ...serverLesson,
      id: serverLesson?.id || matchedLocal?.id,
      isContentLoaded: true,
      slides:
        serverSlides.length > 0
          ? serverSlides
          : Array.isArray(matchedLocal?.slides)
            ? matchedLocal.slides
            : [],
      questions:
        serverQuestions.length > 0
          ? serverQuestions
          : Array.isArray(matchedLocal?.questions)
            ? matchedLocal.questions
            : [],
      assignments:
        serverAssignments.length > 0
          ? serverAssignments
          : Array.isArray(matchedLocal?.assignments)
            ? matchedLocal.assignments
            : [],
      attachments:
        serverAttachments.length > 0
          ? serverAttachments
          : Array.isArray(matchedLocal?.attachments)
            ? matchedLocal.attachments
            : [],
    };
  });
  return [...merged, ...safeLocal.filter((_, index) => !matchedLocalIndices.has(index))];
}
