export interface ExamData {
  title: string;
  description: string;
  coverImage: string;
  grades: string[];
  subjects: string[];
  country: string;
  isCentral: boolean;
  schoolIds: string[];
  duration: number;
  password?: string;
  resultVisibility: string;
  attemptsAllowed: number;
  startDate?: string;
  endDate?: string;
  passingScore: number;
  courseName?: string;
  section?: string;
  domain?: string;
  learningOutcomes?: string;
  indicators?: string;
  skills?: string;
  gradeTarget?: string;
}

export interface Question {
  id?: string | number;
  text: string;
  type: string;
  label?: string;
  options?: any[];
  correctAnswer?: string | any;
  correctAnswers?: string[];
  points?: number;
  xpPoints?: number;
  skill?: string;
  subskill?: string;
  microSkill?: string;
  level?: string;
  dok?: string;
  cognitive?: string;
  standard?: string;
  indicator?: string;
  learningOutcome?: string;
  course?: string;
  section?: string;
  domain?: string;
  errorPattern?: string;
  estimatedTime?: string;
  videoUrl?: string;
  sections?: any[];
  attempts?: number;
  subExamId?: string;
  [key: string]: any;
}

export interface ModuleData {
  id?: string;
  title: string;
  domain: string;
  duration: number;
  passingScore: number;
  content: string;
  videoUrl: string;
  summary?: string;
  notes?: string;
  standards?: string;
  indicators?: string;
  learningOutcomes?: string;
  isVisible: boolean;
  publishDate?: string;
  cutOffDate?: string;
  slides: any[];
  questions: Question[];
  subExams: SubExamData[];
  assignments: Question[];
  attachments: any[];
  _isStandalone?: boolean;
}

export interface SubExamData {
  id?: string;
  title: string;
  duration?: number;
  passingScore?: number;
  attemptsAllowed?: number;
  publishDate?: string;
  cutOffDate?: string;
  questions: Question[];
}
