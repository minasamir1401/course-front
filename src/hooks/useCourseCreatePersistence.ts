"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL, apiFetch } from "@/lib/api";
import {
  CourseCreateRole,
  buildCourseSavePayload,
  mergeServerSavedLessons,
  stageCourseLesson,
  withCourseLessonKey,
} from "@/lib/courseCreatePersistence";
import { captureOfflineOwner, offlineSync } from "@/lib/offlineSync";
import { getAutoTranslateEnabled } from "@/lib/autoTranslatePreference";
import { autoTranslateLessonDraftForSave, lessonNeedsArabicTranslation } from "@/lib/manualAutoTranslate";

interface UseCourseCreatePersistenceParams {
  role: CourseCreateRole;
  tokenKey: string;
  redirectPath: string;
  courseData: any;
  lessons: any[];
  setLessons: React.Dispatch<React.SetStateAction<any[]>>;
  currentLesson: any;
  setCurrentLesson: React.Dispatch<React.SetStateAction<any>>;
  isLessonModalOpen: boolean;
  setIsLessonModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showToast: (message: string, type?: any) => void;
  t: (key: string) => string;
  language: string;
  router: { push: (url: string) => void };
}

interface PersistResult {
  ok: boolean;
  courseId: string | null;
  offlineQueued?: boolean;
  newerEdits?: boolean;
}

export function useCourseCreatePersistence({
  role,
  tokenKey,
  redirectPath,
  courseData,
  lessons,
  setLessons,
  currentLesson,
  setCurrentLesson,
  isLessonModalOpen,
  setIsLessonModalOpen,
  showToast,
  t,
  language,
  router,
}: UseCourseCreatePersistenceParams) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const createdIdRef = useRef<string | null>(null);
  const autoSaveWriteQueueRef = useRef<Promise<void>>(Promise.resolve());
  const autoSaveGenerationRef = useRef(0);
  const lastAutoSaveSnapshotRef = useRef("");
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualSubmitRef = useRef(false);
  const draftKeyRef = useRef<string | null>(null);
  const courseVersionRef = useRef<string | undefined>(undefined);
  const hadQueuedCreateRef = useRef(false);

  const courseDataRef = useRef(courseData);
  courseDataRef.current = courseData;
  const lessonsRef = useRef(lessons);
  lessonsRef.current = lessons;

  const getToken = useCallback(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(tokenKey) || localStorage.getItem("token") || "";
  }, [tokenKey]);

  const runQueuedSave = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const next = autoSaveWriteQueueRef.current.then(task, task);
    autoSaveWriteQueueRef.current = next.then(
      () => undefined,
      () => undefined
    );
    return next;
  }, []);

  const persistCourseToServer = useCallback(
    async (isAutoSave = false): Promise<PersistResult> => {
      if (!isAutoSave) {
        autoSaveGenerationRef.current += 1;
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
          autoSaveTimerRef.current = null;
        }
      }
      const scheduledGeneration = autoSaveGenerationRef.current;

      return runQueuedSave(async () => {
        const activeCourseData = courseDataRef.current;
        const rawLessons = lessonsRef.current;
        const activeLessons = rawLessons.map(withCourseLessonKey);
        if (activeLessons.some((lesson, index) => lesson !== rawLessons[index])) {
          lessonsRef.current = activeLessons;
          setLessons(activeLessons);
        }

        if (!activeCourseData?.title?.trim()) {
          return { ok: false, courseId: createdIdRef.current };
        }
        if (
          isAutoSave &&
          (manualSubmitRef.current || scheduledGeneration !== autoSaveGenerationRef.current)
        ) {
          return { ok: false, courseId: createdIdRef.current };
        }

        const payload = buildCourseSavePayload(activeCourseData, activeLessons, role);
        const autoTranslateOn = getAutoTranslateEnabled();
        const snapshot = JSON.stringify(payload);
        if (isAutoSave && snapshot === lastAutoSaveSnapshotRef.current) {
          return { ok: true, courseId: createdIdRef.current };
        }

        if (!isAutoSave) setIsLoading(true);

        const activeCourseId = createdIdRef.current;
        const createRequestId = draftKeyRef.current ??= crypto.randomUUID();
        const writePayload = activeCourseId
          ? { ...payload, autoTranslate: autoTranslateOn, expectedUpdatedAt: courseVersionRef.current }
          : { ...payload, autoTranslate: autoTranslateOn, createRequestId };
        const method = activeCourseId ? "PUT" : "POST";
        const url = activeCourseId
          ? `${API_URL}/school/courses/${activeCourseId}`
          : `${API_URL}/school/courses`;
        const token = getToken();
        const authHeaders: Record<string, string> = token
          ? { Authorization: `Bearer ${token}` }
          : {};
        const requestOwner = captureOfflineOwner(authHeaders);

        const queueOfflineCopy = async () => {
          const supersedeKey = activeCourseId
            ? `course-put:${activeCourseId}`
            : `course-create:${createRequestId}`;
          if (!activeCourseId) hadQueuedCreateRef.current = true;
          await offlineSync.enqueue({
            url,
            method,
            headers: authHeaders,
            body: JSON.stringify(writePayload),
            owner: requestOwner,
            supersedeKey,
            label:
              language === "ar"
                ? `كورس: ${activeCourseData.title}`
                : `Course: ${activeCourseData.title}`,
          });
        };

        try {
          const res = await apiFetch(url, {
            method,
            headers: {
              ...authHeaders,
              "Content-Type": "application/json",
              "X-Offline-Queue-Managed": "1",
            },
            body: JSON.stringify(writePayload),
          });

          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            const savedCourseId: string | null = data?.id || activeCourseId || null;
            if (!savedCourseId || !data.updatedAt) throw new Error("Missing saved course version");
            const newerEdits = courseDataRef.current !== activeCourseData || lessonsRef.current !== activeLessons;
            courseVersionRef.current = data.updatedAt;

            if (activeCourseId) {
              void offlineSync.removeByUrl(url, "PUT", requestOwner);
            } else if (hadQueuedCreateRef.current) {
              hadQueuedCreateRef.current = false;
              void offlineSync.removeByUrl(url, "POST", requestOwner, `course-create:${createRequestId}`);
            }

            if (savedCourseId && savedCourseId !== createdIdRef.current) {
              createdIdRef.current = savedCourseId;
              setCreatedId(savedCourseId);
            }

            if (Array.isArray(data?.lessons)) {
              const acknowledged = mergeServerSavedLessons(activeLessons, data.lessons);
              const merged = mergeServerSavedLessons(lessonsRef.current, data.lessons, activeLessons);
              lessonsRef.current = merged;
              lastAutoSaveSnapshotRef.current = JSON.stringify(
                buildCourseSavePayload(activeCourseData, acknowledged, role)
              );
              setLessons(merged);
            } else {
              lastAutoSaveSnapshotRef.current = snapshot;
            }

            setLastAutoSave(new Date());
            return { ok: true, courseId: savedCourseId, newerEdits };
          }

          if (res.status >= 500) {
            await queueOfflineCopy();
            if (!isAutoSave) {
              showToast(
                language === "ar"
                  ? "السيرفر غير متاح - تم حفظ التغييرات محلياً؛ راجع التغييرات المعلقة"
                  : "Server unavailable - changes saved locally; check pending saves",
                "info"
              );
            }
            return {
              ok: false,
              courseId: createdIdRef.current,
              offlineQueued: true,
            };
          }

          const errData = await res.json().catch(() => ({}));
          if (!isAutoSave && !errData?.error && !errData?.message && !errData?.details) {
            showToast(
              language === "ar" ? "فشل حفظ الكورس على السيرفر" : "Failed to save course",
              "error"
            );
          }
          return { ok: false, courseId: createdIdRef.current };
        } catch {
          await queueOfflineCopy();
          if (!isAutoSave) {
            showToast(
              language === "ar"
                ? "لا يوجد اتصال - تم حفظ التغييرات محلياً؛ راجع التغييرات المعلقة"
                : "No connection - changes saved locally; check pending saves",
              "info"
            );
          }
          return {
            ok: false,
            courseId: createdIdRef.current,
            offlineQueued: true,
          };
        } finally {
          if (!isAutoSave) setIsLoading(false);
        }
      });
    },
    [getToken, language, role, runQueuedSave, setLessons, showToast]
  );

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isAutoSaveEnabled || isLoading || manualSubmitRef.current || isLessonModalOpen) return;
    if (!courseData?.title?.trim()) return;
    if (!createdIdRef.current && !createdId && lessons.length === 0) return;

    const currentSnapshot = JSON.stringify(
      buildCourseSavePayload(courseData, lessons, role)
    );
    if (currentSnapshot === lastAutoSaveSnapshotRef.current) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    const generation = autoSaveGenerationRef.current;

    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveTimerRef.current = null;
      if (
        generation !== autoSaveGenerationRef.current ||
        manualSubmitRef.current
      ) {
        return;
      }
      void persistCourseToServer(true);
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [courseData, createdId, isAutoSaveEnabled, isLessonModalOpen, isLoading, lessons, persistCourseToServer, role]);

  const saveLesson = useCallback(async () => {
    if (!currentLesson?.title?.trim()) {
      showToast(
        t("courseCreate.lessonTitleRequired") || "Lesson title is required",
        "error"
      );
      return;
    }

    let preparedLesson = withCourseLessonKey({ ...currentLesson, isContentLoaded: true });
    if (getAutoTranslateEnabled() && lessonNeedsArabicTranslation(preparedLesson)) {
      try {
        preparedLesson = await autoTranslateLessonDraftForSave(preparedLesson);
      } catch (err) {
        console.error("Auto-translate lesson draft on create failed:", err);
      }
    }
    const newLessons = stageCourseLesson(lessonsRef.current, preparedLesson);
    if (!newLessons) {
      showToast(language === "ar" ? "لم يعد الدرس موجودًا في الكورس." : "The lesson is no longer in the course.", "error");
      return;
    }

    lessonsRef.current = newLessons;
    setLessons(newLessons);
    setIsLessonModalOpen(false);
    setCurrentLesson({
      newLessonId: crypto.randomUUID(),
      title: "",
      domain: "",
      content: "",
      videoUrl: "",
      summary: "",
      notes: "",
      standards: "",
      indicators: "",
      learningOutcomes: "",
      isVisible: true,
      publishDate: "",
      cutOffDate: "",
      slides: [],
      questions: [],
      assignments: [],
      attachments: [],
    });

    if (courseDataRef.current?.title?.trim() || createdIdRef.current) {
      const result = await persistCourseToServer();
      if (result.ok) {
        showToast(
          language === "ar"
            ? "تم حفظ الدرس والكورس على السيرفر بنجاح"
            : "Lesson and course saved to server",
          "success"
        );
      }
    } else {
      showToast(
        language === "ar"
          ? "تمت إضافة الدرس. يرجى إدخال عنوان الكورس وحفظ الكورس لحفظه على السيرفر."
          : "Lesson staged. Enter a course title and save the course to persist on server.",
        "info"
      );
    }
  }, [
    currentLesson,
    language,
    persistCourseToServer,
    setCurrentLesson,
    setIsLessonModalOpen,
    setLessons,
    showToast,
    t,
  ]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      if (!courseDataRef.current?.title?.trim()) {
        showToast(
          t("courseCreate.titleRequired") || "Please enter a course title",
          "error"
        );
        return;
      }

      if (!Array.isArray(courseDataRef.current?.grades) || courseDataRef.current.grades.length === 0) {
        showToast(
          language === "ar"
            ? "يرجى اختيار صف دراسي واحد على الأقل"
            : "Please select at least one grade level",
          "error"
        );
        return;
      }

      if (!Array.isArray(courseDataRef.current?.subjects) || courseDataRef.current.subjects.length === 0) {
        showToast(
          t("courseCreate.subjectRequired") ||
            "Please select at least one subject / specialization",
          "error"
        );
        return;
      }

      if (isLessonModalOpen) {
        if (!currentLesson?.title?.trim()) {
          showToast(t("courseCreate.lessonTitleRequired") || "Lesson title is required", "error");
          return;
        }
        let preparedOpenLesson = { ...currentLesson, isContentLoaded: true };
        if (getAutoTranslateEnabled() && lessonNeedsArabicTranslation(preparedOpenLesson)) {
          try {
            preparedOpenLesson = await autoTranslateLessonDraftForSave(preparedOpenLesson);
          } catch (err) {
            console.error("Auto-translate open lesson on course submit failed:", err);
          }
        }
        const staged = stageCourseLesson(lessonsRef.current, preparedOpenLesson);
        if (!staged) {
          showToast(language === "ar" ? "لم يعد الدرس موجودًا في الكورس." : "The lesson is no longer in the course.", "error");
          return;
        }
        lessonsRef.current = staged;
        setLessons(staged);
        setIsLessonModalOpen(false);
      }

      manualSubmitRef.current = true;
      try {
        const result = await persistCourseToServer();

        if (result.ok) {
          const hasAssignedSchools =
            role === "SUPER_ADMIN" &&
            !courseDataRef.current?.isCentral &&
            Array.isArray(courseDataRef.current?.schoolIds) &&
            courseDataRef.current.schoolIds.length > 0;
          showToast(
            hasAssignedSchools
              ? t("courseCreate.publishAssignedSuccess") ||
                  "Course created and assigned to selected schools"
              : t("courseCreate.publishSuccess") || "Course created successfully",
            "success"
          );
          if (!result.newerEdits) router.push(redirectPath);
        }
      } finally {
        manualSubmitRef.current = false;
      }
    },
    [
      currentLesson,
      isLessonModalOpen,
      language,
      persistCourseToServer,
      redirectPath,
      role,
      router,
      setIsLessonModalOpen,
      setLessons,
      showToast,
      t,
    ]
  );

  return {
    isLoading,
    isAutoSaveEnabled,
    setIsAutoSaveEnabled,
    lastAutoSave,
    createdId,
    saveLesson,
    handleSubmit,
  };
}
