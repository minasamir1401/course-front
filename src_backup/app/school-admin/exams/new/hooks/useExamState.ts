// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { ExamData, ModuleData, Question } from '../types';

export const useExamState = (schoolIdParam: string | null) => {
  const router = useRouter();

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
      const res = await fetch(`${API_URL}/schools?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSchools(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch schools:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("school_admin_token");
    if (!token) {
      router.push("/school-admin/login");
      return;
    }
    fetchSchools(token);
  }, []);

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



