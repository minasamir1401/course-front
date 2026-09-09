// @ts-nocheck
import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { findSelectedSubExamLocation } from '@/lib/selectedSubExam';
import { attachQuestionsToModules } from '@/lib/examModuleQuestions';
import { normalizePersistedExamQuestions } from '@/lib/persistedExamQuestion';
import { ExamData, ModuleData, Question } from '../types';
import { collectMetadataFromQuestions, INITIAL_AVAILABLE_METADATA, mergeAvailableMetadata } from '@/lib/examQuestionMetadata';
import { resolveExamEditScope } from '@/lib/examScope';

export const useExamState = (schoolIdParam: string | null, examId: string, selectedSubExamId?: string | null) => {
  const router = useRouter();
  const parseStringArray = (value: any): string[] => {
    if (Array.isArray(value)) return [...new Set(value.filter(Boolean).map(String))];
    if (typeof value !== 'string' || !value.trim()) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return [...new Set(parsed.filter(Boolean).map(String))];
    } catch {}
    return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
  };

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isQuestionsLoaded, setIsQuestionsLoaded] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  
  const createdIdRef = useRef<string | null>(null);
  const autoSaveWriteQueueRef = useRef<Promise<void>>(Promise.resolve());
  const autoSaveGenerationRef = useRef(0);
  const lastAutoSaveSnapshotRef = useRef("");
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualSubmitRef = useRef(false);
  const loadGenerationRef = useRef(0);
  const flushAutoSaveRef = useRef<null | (() => Promise<unknown>)>(null);
  const loadedHrefRef = useRef<string | null>(null);
  const restoreDraftHrefRef = useRef<string | null>(null);
  
  const [schools, setSchools] = useState<any[]>([]);
  
  const [examData, setExamData] = useState<ExamData>({
    title: "",
    description: "",
    coverImage: "",
    grades: [],
    subjects: [],
    country: "مصر",
    isCentral: false,
    schoolIds: schoolIdParam ? [schoolIdParam] : [],
    duration: 60,
    password: "",
    resultVisibility: "SHOW_SCORE",
    attemptsAllowed: "",
    startDate: "",
    endDate: "",
    passingScore: 50,
    section: "",
    domain: "",
    learningOutcomes: "",
    indicators: "",
    skills: "",
    gradeTarget: ""
  });

  const [modules, setModules] = useState<ModuleData[]>([]);
  const [standaloneQuestions, setStandaloneQuestions] = useState<Question[]>([]);
  const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([]);
  const [visibleStandaloneCount, setVisibleStandaloneCount] = useState(50);
  const [showSettings, setShowSettings] = useState(false);
  
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModuleIndex, setEditingModuleIndex] = useState<number | null>(null);

  const [activeSubExamIndex, setActiveSubExamIndex] = useState<number | null>(null);
  const [isSubExamModalOpen, setIsSubExamModalOpen] = useState(false);

  const [currentModule, setCurrentModule] = useState<ModuleData>({
    title: "",
    domain: "",
    duration: 30,
    passingScore: 50,
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
    slides: [
      { id: Date.now(), type: 'TEXT', label: 'CONTENT', title: "المقدمة", content: "", videoUrl: "", sections: [] }
    ],
    subExams: [],
    questions: [],
    assignments: [],
    attachments: []
  });

  const [availableMetadata, setAvailableMetadata] = useState(INITIAL_AVAILABLE_METADATA);

  const [activeTab, setActiveTab] = useState<'info' | 'slides' | 'assignments' | 'exercises' | 'attachments' | 'scheduling'>('info');
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [isIndicatorDropdownOpen, setIsIndicatorDropdownOpen] = useState(false);
  const [isOutcomeDropdownOpen, setIsOutcomeDropdownOpen] = useState(false);
  const [isStandardDropdownOpen, setIsStandardDropdownOpen] = useState(false);
  const [isQuestionStandardOpen, setIsQuestionStandardOpen] = useState(false);
  const [isQuestionIndicatorOpen, setIsQuestionIndicatorOpen] = useState(false);
  const [isQuestionOutcomeOpen, setIsQuestionOutcomeOpen] = useState(false);
  const [questionSource, setQuestionSource] = useState<'assignments' | 'questions'>('questions');
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  
  const [tempQuestion, setTempQuestion] = useState<Question>({
    text: "", type: "MCQ", options: ["", "", "", ""],
    correctAnswer: "", points: 1, xpPoints: 10, skill: "General", level: "Medium", dok: "",
    learningOutcome: "", standard: "", indicator: "", 
    sections: [], correctAnswers: [], attempts: 1
  });

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [customSkills, setCustomSkills] = useState<string[]>([]);

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-dropdown-root="true"]')) return;
      setOpenDropdownId(null);
    };
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, []);

  const hydrateSchoolFromSession = () => {
    try {
      const user = JSON.parse(localStorage.getItem("school_admin_user") || "{}");
      const schoolId = String(user?.schoolId || "").trim();
      const schoolName = user?.schoolName || user?.name || "My School";
      setSchools(schoolId ? [{ id: schoolId, name: schoolName }] : []);
    } catch (error) {
      console.error("Failed to hydrate school session:", error);
      setSchools([]);
    }
  };

  
  const fetchQuestions = async (token: string, eId: string, generation: number, href: string) => {
    try {
      setIsLoadingQuestions(true);
      let qRes = await fetch(`${API_URL}/exams/${eId}/questions${selectedSubExamId ? `?subExamId=${encodeURIComponent(selectedSubExamId)}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (qRes.status === 404) {
        // Fallback for servers where /questions is not yet deployed
        qRes = await fetch(`${API_URL}/exams/${eId}?onlyQuestions=true${selectedSubExamId ? `&subExamId=${encodeURIComponent(selectedSubExamId)}` : ''}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        });
      }
      if (qRes.ok) {
        const qData = await qRes.json();
        if (generation !== loadGenerationRef.current) return;
        const rawQuestions = qData.questions || (Array.isArray(qData) ? qData : []);
        const allQs = normalizePersistedExamQuestions(rawQuestions);

        setModules((prevModules: any[]) => {
          return attachQuestionsToModules(prevModules, allQs);
        });

        setCurrentModule((prevCurrent: any) => {
          if (!prevCurrent?.id) return prevCurrent;
          const currentModuleQs = allQs.filter((q: any) => String(q.moduleId || '') === String(prevCurrent.id));
          return {
            ...prevCurrent,
            questions: currentModuleQs.filter((q: any) => !q.subExamId),
            subExams: (prevCurrent.subExams || []).map((se: any) => {
              const seQs = currentModuleQs.filter((q: any) => String(q.subExamId || '') === String(se.id));
              return {
                ...se,
                questions: seQs,
                questionsCount: seQs.length || se.questionsCount || se._count?.questions || 0
              };
            })
          };
        });

        const standaloneQs = allQs.filter((q: any) => !q.moduleId && !q.subExamId);
        setStandaloneQuestions(standaloneQs);
        setAvailableMetadata((prev: any) => mergeAvailableMetadata(prev, collectMetadataFromQuestions(allQs)));
        loadedHrefRef.current = href;
        setIsQuestionsLoaded(true);
      }
    } catch (error) {
      console.error("Failed to fetch questions in background:", error);
    } finally {
      if (generation === loadGenerationRef.current) setIsLoadingQuestions(false);
    }
  };

  const fetchExamData = async (token: string, eId: string) => {
    const href = window.location.pathname + window.location.search;
    if (restoreDraftHrefRef.current === href) {
      restoreDraftHrefRef.current = null;
      setIsLoading(false);
      setIsInitialLoad(false);
      return;
    }
    const generation = ++loadGenerationRef.current;
    try {
      setIsLoading(true);
      // Flush the previous scope's latest draft before replacing its editor state.
      if (loadedHrefRef.current && flushAutoSaveRef.current) {
        const saved = await flushAutoSaveRef.current();
        if (generation !== loadGenerationRef.current) return;
        if (saved === false) {
          restoreDraftHrefRef.current = loadedHrefRef.current;
          router.replace(loadedHrefRef.current);
          return;
        }
      }
      await autoSaveWriteQueueRef.current;
      if (generation !== loadGenerationRef.current) return;
      setIsInitialLoad(true);
      setIsQuestionsLoaded(false);
      autoSaveGenerationRef.current += 1;
      setIsLoadingQuestions(true);
      // Phase 1: Fetch exam structure and modules without questions for instant display
      const res = await fetch(`${API_URL}/exams/${eId}?includeQuestions=false`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (generation !== loadGenerationRef.current) return;
        const exam = data.data || data;
        if (exam) {
          const resolvedScope = resolveExamEditScope(exam, schoolIdParam);
          setExamData({
            title: exam.title || "",
            description: exam.description || "",
            coverImage: exam.coverImage || "",
            grades: parseStringArray(exam.grades),
            subjects: parseStringArray(exam.subjects),
            country: exam.country || "مصر",
            isCentral: resolvedScope.isCentral,
            schoolIds: resolvedScope.schoolIds,
            duration: exam.duration || 60,
            password: exam.password || "",
            resultVisibility: exam.resultVisibility || "SHOW_SCORE",
            attemptsAllowed: exam.attemptsAllowed || 1,
            startDate: exam.startDate ? exam.startDate.split('T')[0] : "",
            endDate: exam.endDate ? exam.endDate.split('T')[0] : "",
            passingScore: exam.passingScore || 50,
            section: exam.section || "",
            domain: exam.domain || "",
            learningOutcomes: exam.learningOutcomes || "",
            indicators: exam.indicators || "",
            skills: exam.skills || "",
            gradeTarget: exam.gradeTarget || "",
            status: exam.status || "PUBLISHED"
          });

          if (exam.modules) {
            const initialModules = exam.modules.map((m: any) => ({
              ...m,
              questions: m.questions || [],
              assignments: m.assignments || [],
              subExams: (m.subExams || []).map((se: any) => ({
                ...se,
                questions: se.questions || [],
                questionsCount: se.questionsCount ?? se._count?.questions ?? 0
              }))
            }));
            setModules(initialModules);

            if (selectedSubExamId) {
              const selectedLocation = findSelectedSubExamLocation(initialModules, selectedSubExamId);
              if (selectedLocation) {
                setEditingModuleIndex(selectedLocation.moduleIndex);
                setCurrentModule(initialModules[selectedLocation.moduleIndex]);
                setActiveSubExamIndex(selectedLocation.subExamIndex);
                setActiveTab('exercises');
                setIsModuleModalOpen(true);
              }
            }
          }

          if (exam.id || exam._id) {
            createdIdRef.current = exam.id || exam._id;
            setCreatedId(exam.id || exam._id);
          }

          // Unblock the page immediately so all exams/modules appear without waiting
          setIsLoading(false);
          setIsInitialLoad(false);

          // Phase 2: Load questions asynchronously in background
          fetchQuestions(token, eId, generation, href);
          return;
        }
      }
    } catch (error) {
      console.error("Failed to fetch exam:", error);
    } finally {
      if (generation === loadGenerationRef.current) {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    }
  };
useEffect(() => {
    const token = localStorage.getItem("school_admin_token");
    if (!token) {
      router.push("/school-admin/login");
      return;
    }
    hydrateSchoolFromSession();
    if (examId) {
      fetchExamData(token, examId);
    }
    return () => { loadGenerationRef.current += 1; };
  }, [examId, selectedSubExamId]);

    const allExistingSkills = Array.from(new Set([...(customSkills || []), 'Problem Solving', 'Critical Thinking', 'Data Analysis', 'Reading Comprehension']));

  return {
    allExistingSkills,
    isInitialLoad,
    isLoading, setIsLoading,
    isLoadingQuestions, setIsLoadingQuestions,
    isQuestionsLoaded,
    isAutoSaveEnabled, setIsAutoSaveEnabled,
    lastAutoSave, setLastAutoSave,
    createdId, setCreatedId,
    createdIdRef, autoSaveWriteQueueRef, autoSaveGenerationRef,
    lastAutoSaveSnapshotRef, autoSaveTimerRef, manualSubmitRef, flushAutoSaveRef,
    schools, setSchools,
    examData, setExamData,
    modules, setModules,
    standaloneQuestions, setStandaloneQuestions,
    deletedQuestionIds, setDeletedQuestionIds,
    visibleStandaloneCount, setVisibleStandaloneCount,
    showSettings, setShowSettings,
    isModuleModalOpen, setIsModuleModalOpen,
    editingModuleIndex, setEditingModuleIndex,
    currentModule, setCurrentModule,
    availableMetadata, setAvailableMetadata,
    activeTab, setActiveTab,
    showQuestionForm, setShowQuestionForm,
    isIndicatorDropdownOpen, setIsIndicatorDropdownOpen,
    isOutcomeDropdownOpen, setIsOutcomeDropdownOpen,
    isStandardDropdownOpen, setIsStandardDropdownOpen,
    isQuestionStandardOpen, setIsQuestionStandardOpen,
    isQuestionIndicatorOpen, setIsQuestionIndicatorOpen,
    isQuestionOutcomeOpen, setIsQuestionOutcomeOpen,
    questionSource, setQuestionSource,
    editingQuestionIndex, setEditingQuestionIndex,
    tempQuestion, setTempQuestion,
    openDropdownId, setOpenDropdownId,
    customSkills, setCustomSkills,
    activeSubExamIndex, setActiveSubExamIndex,
    isSubExamModalOpen, setIsSubExamModalOpen
  };
};



