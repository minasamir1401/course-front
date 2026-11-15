import { lessonTranslationPayload } from './bilingualMetadata';
import { parseLessonJsonArray } from './courseCreatePersistence';
export function buildCourseLessonSummary(lesson: any) {
  const slidesCount = lesson.slidesCount == null
    ? parseLessonJsonArray(lesson.slides).length
    : Number(lesson.slidesCount) || 0;

  return {
    id: lesson.id || lesson._id,
    courseId: lesson.courseId,
    title: lesson.title || "",
    domain: lesson.domain || "",
    videoUrl: lesson.videoUrl || "",
    summary: lesson.summary || "",
    notes: lesson.notes || "",
    ...lessonTranslationPayload(lesson),
    standards: lesson.standards || "",
    indicators: lesson.indicators || "",
    learningOutcomes: lesson.learningOutcomes || "",
    isVisible: lesson.isVisible !== undefined ? lesson.isVisible : true,
    publishDate: lesson.publishDate || "",
    cutOffDate: lesson.cutOffDate || "",
    order: lesson.order,
    duration: lesson.duration ?? 0,
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
    slidesCount,
    isContentLoaded: false,
  };
}
