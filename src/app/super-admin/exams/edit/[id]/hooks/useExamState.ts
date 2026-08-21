// @ts-nocheck
import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { ExamData, ModuleData, Question } from '../types';

export const useExamState = (schoolIdParam: string | null, examId: string) => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
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
  
  const [schools, setSchools] = useState<any[]>([]);
  
  const [examData, setExamData] = useState<ExamData>({
    title: "",
    description: "",
    coverImage: "",
    grades: [],
    subjects: [],
    country: "Ù…ØµØ±",
    isCentral: !schoolIdParam,
    schoolIds: schoolIdParam ? [schoolIdParam] : [],
    duration: 60,
    password: "",
    resultVisibility: "SHOW_SCORE",
    attemptsAllowed: 1,
    startDate: "",
    endDate: "",
    passingScore: 50,
    courseName: "",
    section: "",
    domain: "",
    learningOutcomes: "",
    indicators: "",
    skills: "",
    gradeTarget: ""
  });

  const [modules, setModules] = useState<ModuleData[]>([]);
  const [standaloneQuestions, setStandaloneQuestions] = useState<Question[]>([]);
  const [visibleStandaloneCount, setVisibleStandaloneCount] = useState(50);
  const [showSettings, setShowSettings] = useState(true);
  
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
      { id: Date.now(), type: 'TEXT', label: 'CONTENT', title: "Ø§Ù„Ù…Ù‚Ø¯Ù…Ø©", content: "", videoUrl: "", sections: [] }
    ],
    subExams: [],
    questions: [],
    assignments: [],
    attachments: []
  });

  const [availableMetadata, setAvailableMetadata] = useState({
    domains: [] as string[],
    standards: [] as string[],
    indicators: [] as string[],
    outcomes: [] as string[]
  });

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

  const fetchSchools = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/schools?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSchools(Array.isArray(data) ? data : (data.schools || data.data || []));
      }
    } catch (error) {
      console.error("Failed to fetch schools:", error);
    }
  };

  
  const fetchExamData = async (token: string, eId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/exams/${eId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const exam = data.data || data;
        if (exam) {
          setExamData({
            title: exam.title || "",
            description: exam.description || "",
            coverImage: exam.coverImage || "",
            grades: exam.grades || [],
            subjects: Array.isArray(exam.subjects) ? exam.subjects : [],
            country: exam.country || "Ù…ØµØ±",
            isCentral: exam.isCentral !== undefined ? exam.isCentral : true,
            schoolIds: exam.schoolIds || [],
            duration: exam.duration || 60,
            password: exam.password || "",
            resultVisibility: exam.resultVisibility || "SHOW_SCORE",
            attemptsAllowed: exam.attemptsAllowed || 1,
            startDate: exam.startDate ? exam.startDate.split('T')[0] : "",
            endDate: exam.endDate ? exam.endDate.split('T')[0] : "",
            passingScore: exam.passingScore || 50,
            courseName: exam.courseName || "",
            section: exam.section || "",
            domain: exam.domain || "",
            learningOutcomes: exam.learningOutcomes || "",
            indicators: exam.indicators || "",
            skills: exam.skills || "",
            gradeTarget: exam.gradeTarget || ""
          });
          
          const allQs = exam.questions || [];
          if (exam.modules) {
             const mods = exam.modules.map((m: any) => {
                 const mQs = allQs.filter((q: any) => q.moduleId === m.id && !q.subExamId);
                 const subExams = (m.subExams || []).map((s: any) => {
                     const sQs = allQs.filter((q: any) => q.subExamId === s.id);
                     return { ...s, questions: sQs };
                 });
                 return { ...m, questions: mQs, subExams };
             });
             setModules(mods);
          }
          
          const standaloneQs = allQs.filter((q: any) => !q.moduleId && !q.subExamId);
          setStandaloneQuestions(standaloneQs);
          if (exam.id || exam._id) {
            createdIdRef.current = exam.id || exam._id;
            setCreatedId(exam.id || exam._id);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch exam:", error);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };
useEffect(() => {
    const token = localStorage.getItem("super_admin_token");
    if (!token) {
      router.push("/super-admin/login");
      return;
    }
    fetchSchools(token);
    if (examId && isInitialLoad) {
      fetchExamData(token, examId);
    }
  }, [examId, isInitialLoad]);

    const allExistingSkills = Array.from(new Set([...(customSkills || []), 'Problem Solving', 'Critical Thinking', 'Data Analysis', 'Reading Comprehension']));

  return {
    allExistingSkills,
    isLoading, setIsLoading,
    isAutoSaveEnabled, setIsAutoSaveEnabled,
    lastAutoSave, setLastAutoSave,
    createdId, setCreatedId,
    createdIdRef, autoSaveWriteQueueRef, autoSaveGenerationRef,
    lastAutoSaveSnapshotRef, autoSaveTimerRef, manualSubmitRef,
    schools, setSchools,
    examData, setExamData,
    modules, setModules,
    standaloneQuestions, setStandaloneQuestions,
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



