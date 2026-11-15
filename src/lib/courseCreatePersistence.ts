import { lessonTranslationPayload } from "./bilingualMetadata";
import { parseEgyptDate } from "./egyptTime";

export type CourseCreateRole = "SUPER_ADMIN" | "SCHOOL_ADMIN";

type LessonIdentity = { id?: string; newLessonId?: string };

export function courseLessonKey(lesson: LessonIdentity) {
  return lesson.id || lesson.newLessonId;
}

export function withCourseLessonKey<T extends LessonIdentity>(lesson: T): T {
  return courseLessonKey(lesson) ? lesson : { ...lesson, newLessonId: crypto.randomUUID() };
}

export function stageCourseLesson<T extends LessonIdentity>(lessons: T[], lesson: T): T[] | null {
  const key = courseLessonKey(lesson);
  const index = key ? lessons.findIndex(item => courseLessonKey(item) === key) : -1;
  if (index < 0) return lesson.id ? null : [...lessons, withCourseLessonKey(lesson)];
  const next = [...lessons];
  const persisted = lessons[index];
  next[index] = persisted.id && !lesson.id
    ? { ...lesson, id: persisted.id, newLessonId: undefined }
    : lesson;
  return next;
}

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
    ...(lesson?.id ? { id: lesson.id, expectedUpdatedAt: lesson.updatedAt } : { newLessonId: lesson?.newLessonId }),
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
    const identity = lesson && courseLessonKey(lesson);
    if (!identity) return true;
    if (seenLessonIds.has(identity)) return false;
    seenLessonIds.add(identity);
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

  const localById = new Map(safeLocal.map(lesson => [courseLessonKey(lesson), lesson]));
  const submittedById = new Map(submittedLessons.map(lesson => [courseLessonKey(lesson), lesson]));
  const serverIds = new Set(serverLessons.map(lesson => lesson.id));
  const merged = serverLessons.map(serverLesson => {
    const matchedLocal = serverLesson.id ? localById.get(serverLesson.id) : undefined;
    const submittedLesson = submittedById.get(serverLesson.id);
    if (matchedLocal && matchedLocal !== submittedLesson) {
      return { ...matchedLocal, id: serverLesson.id, newLessonId: undefined, updatedAt: serverLesson.updatedAt, isContentLoaded: true };
    }

    const serverSlides = parseLessonJsonArray(serverLesson?.slides);
    const serverQuestions = parseLessonJsonArray(serverLesson?.questions);
    const serverAssignments = parseLessonJsonArray(serverLesson?.assignments);
    const serverAttachments = parseLessonJsonArray(serverLesson?.attachments);

    return {
      ...matchedLocal,
      ...serverLesson,
      id: serverLesson?.id || matchedLocal?.id,
      newLessonId: undefined,
      isContentLoaded: true,
      slides:
        serverLesson.slides !== undefined
          ? serverSlides
          : Array.isArray(matchedLocal?.slides)
            ? matchedLocal.slides
            : [],
      questions:
        serverLesson.questions !== undefined
          ? serverQuestions
          : Array.isArray(matchedLocal?.questions)
            ? matchedLocal.questions
            : [],
      assignments:
        serverLesson.assignments !== undefined
          ? serverAssignments
          : Array.isArray(matchedLocal?.assignments)
            ? matchedLocal.assignments
            : [],
      attachments:
        serverLesson.attachments !== undefined
          ? serverAttachments
          : Array.isArray(matchedLocal?.attachments)
            ? matchedLocal.attachments
            : [],
    };
  });
  return [...merged, ...safeLocal.filter(lesson => !lesson.id && !serverIds.has(courseLessonKey(lesson)))];
}
