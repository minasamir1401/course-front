import type React from 'react';

export interface CourseData {
  title: string;
  description: string;
  coverImage: string;
  grades: string[];
  subject: string;
  country: string;
  isCentral: boolean;
  schoolId: string;
  schoolIds: string[];
}

export interface Lesson {
  id?: string;
  title: string;
  domain: string;
  domainEn?: string;
  standardsEn?: string;
  indicatorsEn?: string;
  learningOutcomesEn?: string;
  videoUrl: string;
  summary: string;
  notes: string;
  standards: string;
  indicators: string;
  learningOutcomes: string;
  isVisible: boolean;
  publishDate: string;
  cutOffDate: string;
  slides: any[];
  questions: any[];
  assignments: any[];
  attachments: any[];
  createdAt?: string | Date;
  slidesCount?: number;
  isContentLoaded?: boolean;
}

export interface CourseEditorContextType {
  role: "SUPER_ADMIN" | "SCHOOL_ADMIN";
  courseId: string | null;
  schoolIdParam: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  schools: any[];
  isAutoSaveEnabled: boolean;
  setIsAutoSaveEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  lastAutoSave: Date | null;
  setLastAutoSave: React.Dispatch<React.SetStateAction<Date | null>>;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  courseData: CourseData;
  setCourseData: React.Dispatch<React.SetStateAction<CourseData>>;
  lessons: Lesson[];
  setLessons: React.Dispatch<React.SetStateAction<Lesson[]>>;
  exams: any[];
  setExams: React.Dispatch<React.SetStateAction<any[]>>;
  activeContentTab: "lessons";
  isLessonModalOpen: boolean;
  isLessonContentLoading: boolean;
  availableMetadata: { domains: string[]; standards: string[]; indicators: string[]; outcomes: string[] };
  setAvailableMetadata: React.Dispatch<React.SetStateAction<{ domains: string[]; standards: string[]; indicators: string[]; outcomes: string[] }>>;
  setIsLessonModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBankModalOpen: boolean;
  setIsBankModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isQuestionBankModalOpen: boolean;
  setIsQuestionBankModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  bankItems: any[];
  setBankItems: React.Dispatch<React.SetStateAction<any[]>>;
  bankQuestions: any[];
  setBankQuestions: React.Dispatch<React.SetStateAction<any[]>>;
  editingLessonIndex: number | null;
  setEditingLessonIndex: React.Dispatch<React.SetStateAction<number | null>>;
  currentLesson: Lesson;
  setCurrentLesson: React.Dispatch<React.SetStateAction<Lesson>>;
  activeTab: "info" | "slides" | "exercises" | "assignments" | "attachments" | "scheduling";
  setActiveTab: React.Dispatch<React.SetStateAction<"info" | "slides" | "exercises" | "assignments" | "attachments" | "scheduling">>;
  showQuestionForm: boolean;
  setShowQuestionForm: React.Dispatch<React.SetStateAction<boolean>>;
  editingQuestionIndex: number | null;
  setEditingQuestionIndex: React.Dispatch<React.SetStateAction<number | null>>;
  questionSource: "assignments" | "questions";
  setQuestionSource: React.Dispatch<React.SetStateAction<"assignments" | "questions">>;
  tempQuestion: any;
  setTempQuestion: React.Dispatch<React.SetStateAction<any>>;
  openDropdownId: string | null;
  setOpenDropdownId: React.Dispatch<React.SetStateAction<string | null>>;
  metadataExcelRef: React.RefObject<HTMLInputElement | null>;
  questionsExcelRef: React.RefObject<HTMLInputElement | null>;
  assignmentsExcelRef: React.RefObject<HTMLInputElement | null>;

  // Handlers
  fetchCourseData: (token: string, id: string) => Promise<void>;
  toggleCourseSchool: (id: string) => void;
  selectAllSchools: () => void;
  handleRemoveLesson: (index: number) => void;
  openAddLessonModal: () => void;
  openEditLessonModal: (index: number) => void;
  openBankModal: () => Promise<void>;
  openQuestionBankModal: () => Promise<void>;
  addQuestionFromBank: (q: any) => void;
  saveLesson: () => Promise<void>;
  handleSubmit: (e?: React.FormEvent, isAutoSave?: boolean) => Promise<void>;
  handleDeleteCourse: () => Promise<void>;
  linkExamToCourse: (examId: string) => Promise<void>;
  // Draft backup
  hasDraft: boolean;
  draftSavedAt: string | null;
  restoreFromDraft: () => Promise<void>;
  clearDraft: () => void;
  isSettingsHidden: boolean;
  setIsSettingsHidden: React.Dispatch<React.SetStateAction<boolean>>;
  allowContentDeletion: boolean;
}

