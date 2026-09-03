export function buildCourseLessonSummary(lesson: any) {
  const slidesCount = Number(lesson.slidesCount)
    || (Array.isArray(lesson.slides) ? lesson.slides.length : 0)
    || (typeof lesson.slides === "string" ? (lesson.slides.match(/"id"\s*:/g) || []).length : 0);

  return {
    id: lesson.id || lesson._id,
    courseId: lesson.courseId,
    title: lesson.title || "",
    domain: lesson.domain || "",
    videoUrl: lesson.videoUrl || "",
    summary: lesson.summary || "",
    notes: lesson.notes || "",
    standards: lesson.standards || "",
    indicators: lesson.indicators || "",
    learningOutcomes: lesson.learningOutcomes || "",
    isVisible: lesson.isVisible !== undefined ? lesson.isVisible : true,
    publishDate: lesson.publishDate || "",
    cutOffDate: lesson.cutOffDate || "",
    order: lesson.order,
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
    slidesCount,
    isContentLoaded: false,
  };
}
