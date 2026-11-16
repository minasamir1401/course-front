"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Check,
  Search,
  ChevronDown,
  ChevronRight,
  Folder,
  FileText,
  FileQuestion,
  UploadCloud,
  Loader2,
  BookOpen,
  Users,
  School,
  Sparkles,
  Image as ImageIcon,
  Layers,
  Award,
} from "lucide-react";

interface ExploreItem {
  id: string;
  type: 'course' | 'lesson' | 'exam';
  title: string;
  subject?: string | null;
  grade?: string | null;
  isCentral?: boolean;
  schoolName?: string | null;
  deletedAt?: string | null;
  lessonCount?: number;
  examCount?: number;
  trashedCount?: number;
  questionsCount?: number;
  assignmentsCount?: number;
  hasSlides?: boolean;
  modulesCount?: number;
  status?: string;
  children?: ExploreItem[];
}

interface BackupDetails {
  meta?: {
    version?: string;
    timestamp?: string | null;
    isZipArchive?: boolean;
  };
  summary?: {
    schools: number;
    classrooms: number;
    usersTotal: number;
    trashedUsers: number;
    usersByRole: Record<string, number>;
    courses: number;
    trashedCourses: number;
    lessons: number;
    trashedLessons: number;
    exams: number;
    trashedExams: number;
    examFolders: number;
    examModules: number;
    subExams: number;
    questions: number;
    skillClusters: number;
    skillLessons: number;
    interactiveActivities: number;
    competitions: number;
    certificates: number;
    mediaFiles: number;
    mediaUploadsCount: number;
    mediaS3Count: number;
  };
  schools?: Array<{
    id: string;
    name: string;
    subdomain: string | null;
    coursesCount: number;
    classroomsCount: number;
    teachersCount: number;
    studentsCount: number;
    adminsCount: number;
  }>;
  users?: Array<{
    id: string;
    name: string;
    username: string;
    email: string | null;
    role: string;
    schoolId: string | null;
    schoolName: string | null;
    grade: string | null;
    specialization: string | null;
    deletedAt: string | null;
    exposedResetRequired?: boolean;
  }>;
  exams?: Array<{
    id: string;
    title: string;
    courseId: string | null;
    courseTitle: string | null;
    folderTitle: string | null;
    schoolName: string | null;
    isCentral: boolean;
    status: string;
    grade: string | null;
    duration: number | null;
    questionsCount: number;
    modulesCount: number;
    subExamsCount: number;
    deletedAt: string | null;
  }>;
  skills?: Array<{
    id: string;
    name: string;
    description: string | null;
    subject: string | null;
    grade: string | null;
    isCentral: boolean;
    schoolName: string | null;
    lessonsCount: number;
    activitiesCount: number;
    lessons: Array<{
      id: string;
      name: string;
      order: number;
      activitiesCount: number;
      activityTypes: string[];
    }>;
  }>;
  competitions?: Array<{
    id: string;
    title: string;
    status: string;
    mode: string;
    grade: string | null;
    subject: string | null;
    schoolName: string | null;
    questionsCount: number;
  }>;
  media?: {
    totalCount: number;
    uploadsCount: number;
    s3Count: number;
    files: string[];
  };
}

interface Selection {
  id: string;
  type: string;
  targetCourseId?: string;
}

interface LiveCourse {
  id: string;
  title: string;
}

interface BackupExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  treeData: ExploreItem[];
  details?: BackupDetails | null;
  filename: string;
  source: 'local' | 'cloud';
  liveCourses: LiveCourse[];
  language: "ar" | "en";
  onRestore: (selections: Selection[]) => Promise<void>;
}

type ExplorerTab = 'courses' | 'exams' | 'skills' | 'people' | 'media';

export default function BackupExplorerModal({
  isOpen,
  onClose,
  treeData,
  details,
  filename,
  liveCourses,
  language,
  onRestore
}: BackupExplorerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ExplorerTab>('courses');
  const [selections, setSelections] = useState<Selection[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [schoolFilter, setSchoolFilter] = useState<string>("ALL");
  const [isRestoring, setIsRestoring] = useState(false);

  const isAr = language === 'ar';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('courses');
      setSelections([]);
      setExpanded(new Set());
      setExpandedSkills(new Set());
      setSearchQuery("");
      setRoleFilter("ALL");
      setSchoolFilter("ALL");
      setIsRestoring(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isRestoring) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isRestoring, onClose]);

  const summary = details?.summary;

  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return treeData;
    const q = searchQuery.toLowerCase();
    const walk = (nodes: ExploreItem[]): ExploreItem[] =>
      nodes
        .map((node) => {
          const matchSelf =
            String(node.title || '').toLowerCase().includes(q) ||
            String(node.subject || '').toLowerCase().includes(q) ||
            String(node.schoolName || '').toLowerCase().includes(q);
          const matchedChildren = node.children ? walk(node.children) : [];
          if (matchSelf || matchedChildren.length > 0) {
            return { ...node, children: matchSelf && matchedChildren.length === 0 ? node.children : matchedChildren };
          }
          return null;
        })
        .filter(Boolean) as ExploreItem[];
    return walk(treeData);
  }, [treeData, searchQuery]);

  const filteredExams = useMemo(() => {
    const list = details?.exams || [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((e) =>
      String(e.title || '').toLowerCase().includes(q) ||
      String(e.courseTitle || '').toLowerCase().includes(q) ||
      String(e.folderTitle || '').toLowerCase().includes(q) ||
      String(e.schoolName || '').toLowerCase().includes(q),
    );
  }, [details?.exams, searchQuery]);

  const filteredSkills = useMemo(() => {
    const list = details?.skills || [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((sc) =>
      String(sc.name || '').toLowerCase().includes(q) ||
      String(sc.subject || '').toLowerCase().includes(q) ||
      String(sc.grade || '').toLowerCase().includes(q) ||
      sc.lessons.some((l) => String(l.name || '').toLowerCase().includes(q)),
    );
  }, [details?.skills, searchQuery]);

  const filteredCompetitions = useMemo(() => {
    const list = details?.competitions || [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) =>
      String(c.title || '').toLowerCase().includes(q) ||
      String(c.subject || '').toLowerCase().includes(q),
    );
  }, [details?.competitions, searchQuery]);

  const filteredUsers = useMemo(() => {
    const list = details?.users || [];
    const q = searchQuery.trim().toLowerCase();
    return list.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (schoolFilter !== 'ALL' && (u.schoolId || 'CENTRAL') !== schoolFilter) return false;
      if (!q) return true;
      return (
        String(u.name || '').toLowerCase().includes(q) ||
        String(u.username || '').toLowerCase().includes(q) ||
        String(u.email || '').toLowerCase().includes(q) ||
        String(u.schoolName || '').toLowerCase().includes(q)
      );
    });
  }, [details?.users, roleFilter, schoolFilter, searchQuery]);

  const filteredMediaFiles = useMemo(() => {
    const list = details?.media?.files || [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((f) => f.toLowerCase().includes(q));
  }, [details?.media?.files, searchQuery]);

  if (!isOpen || !mounted) return null;

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSkillExpand = (id: string) => {
    setExpandedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAllCourses = () => setExpanded(new Set(treeData.map((n) => n.id)));
  const collapseAllCourses = () => setExpanded(new Set());

  const isSelected = (id: string) => selections.some((s) => s.id === id);

  const handleSelect = (item: { id: string; type: string }, isChecked: boolean) => {
    if (isChecked) {
      if (!selections.some((s) => s.id === item.id)) {
        setSelections([...selections, { id: item.id, type: item.type }]);
      }
    } else {
      setSelections(selections.filter((s) => s.id !== item.id));
    }
  };

  const handleTargetCourseChange = (id: string, courseId: string) => {
    setSelections(selections.map((s) => (s.id === id ? { ...s, targetCourseId: courseId } : s)));
  };

  const handleConfirm = async () => {
    setIsRestoring(true);
    await onRestore(selections);
    setIsRestoring(false);
  };

  const renderIcon = (type: string) => {
    if (type === 'course') return <Folder className="w-5 h-5 text-indigo-500 shrink-0" />;
    if (type === 'lesson') return <FileText className="w-4 h-4 text-emerald-500 shrink-0" />;
    if (type === 'exam') return <FileQuestion className="w-4 h-4 text-amber-500 shrink-0" />;
    return null;
  };

  const roleLabel = (role: string) => {
    if (!isAr) return role;
    const map: Record<string, string> = {
      SUPER_ADMIN: 'سوبر أدمن',
      SCHOOL_ADMIN: 'مدير مدرسة',
      TEACHER: 'معلم',
      STUDENT: 'طالب',
      PARENT: 'ولي أمر',
      EXAM_SUPERVISOR: 'مشرف اختبارات',
    };
    return map[role] || role;
  };

  const tabs: Array<{ id: ExplorerTab; label: string; count: number; icon: any }> = [
    {
      id: 'courses',
      label: isAr ? 'الكورسات والدروس' : 'Courses & Lessons',
      count: summary ? summary.courses : treeData.length,
      icon: BookOpen,
    },
    {
      id: 'exams',
      label: isAr ? 'الامتحانات والأسئلة' : 'Exams & Questions',
      count: summary ? summary.exams : 0,
      icon: FileQuestion,
    },
    {
      id: 'skills',
      label: isAr ? 'المهارات والمسابقات' : 'Skills & Competitions',
      count: summary ? summary.skillClusters + summary.competitions : 0,
      icon: Sparkles,
    },
    {
      id: 'people',
      label: isAr ? 'المدارس والطلاب والمدرسين' : 'Schools & Users',
      count: summary ? summary.usersTotal : 0,
      icon: Users,
    },
    {
      id: 'media',
      label: isAr ? 'الصور والشهادات' : 'Images & Certificates',
      count: summary ? summary.mediaFiles + summary.certificates : 0,
      icon: ImageIcon,
    },
  ];

  const isSystemVirtualGroup = (id: string) => id === 'standalone_exams' || id === 'orphaned_lessons';

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/65 backdrop-blur-sm"
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRestoring) onClose();
      }}
    >
      <div className="bg-white rounded-2xl sm:rounded-[28px] w-full max-w-5xl max-h-[94dvh] sm:max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl border border-slate-200/60 min-w-0">

        {/* Pinned Header */}
        <div className="shrink-0 flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-black text-slate-800 truncate">
                {isAr ? "مستكشف محتويات النسخة" : "Backup Content Explorer"}
              </h2>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] sm:text-xs text-slate-500 font-semibold mt-0.5">
                <span className="font-mono break-all" dir="ltr">{filename.replace('السحابة:', '')}</span>
                {details?.meta?.timestamp && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 whitespace-nowrap">
                    {new Date(details.meta.timestamp).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-red-500 rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Region (KPI Summary + Tabs + Search + Active View) */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 min-w-0">
                <div className="text-slate-500 font-bold mb-0.5 truncate">{isAr ? 'الكورسات / الدروس' : 'Courses / Lessons'}</div>
                <div className="font-black text-slate-800 text-sm">
                  {summary.courses} / {summary.lessons}
                </div>
                {(summary.trashedCourses > 0 || summary.trashedLessons > 0) && (
                  <div className="text-[10px] font-bold text-amber-700 mt-0.5">
                    {isAr ? `سلة: ${summary.trashedCourses} كورس، ${summary.trashedLessons} درس` : `Trash: ${summary.trashedCourses}c / ${summary.trashedLessons}l`}
                  </div>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 min-w-0">
                <div className="text-slate-500 font-bold mb-0.5 truncate">{isAr ? 'الامتحانات / الأسئلة' : 'Exams / Questions'}</div>
                <div className="font-black text-slate-800 text-sm">
                  {summary.exams} / {summary.questions}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  {isAr ? `${summary.examModules} موديول • ${summary.subExams} فرعي` : `${summary.examModules} mod • ${summary.subExams} sub`}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 min-w-0">
                <div className="text-slate-500 font-bold mb-0.5 truncate">{isAr ? 'المهارات / الأنشطة' : 'Skills / Activities'}</div>
                <div className="font-black text-slate-800 text-sm">
                  {summary.skillClusters} / {summary.interactiveActivities}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  {isAr ? `${summary.skillLessons} مهارة • ${summary.competitions} مسابقة` : `${summary.skillLessons} lessons • ${summary.competitions} comp`}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 min-w-0">
                <div className="text-slate-500 font-bold mb-0.5 truncate">{isAr ? 'المدارس / الفصول' : 'Schools / Classes'}</div>
                <div className="font-black text-slate-800 text-sm">
                  {summary.schools} / {summary.classrooms}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  {isAr ? `مديرين: ${summary.usersByRole?.SCHOOL_ADMIN || 0}` : `Admins: ${summary.usersByRole?.SCHOOL_ADMIN || 0}`}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 min-w-0">
                <div className="text-slate-500 font-bold mb-0.5 truncate">{isAr ? 'المدرسون / الطلاب' : 'Teachers / Students'}</div>
                <div className="font-black text-slate-800 text-sm">
                  {summary.usersByRole?.TEACHER || 0} / {summary.usersByRole?.STUDENT || 0}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  {isAr ? `الحسابات: ${summary.usersTotal}` : `Users: ${summary.usersTotal}`}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 min-w-0">
                <div className="text-slate-500 font-bold mb-0.5 truncate">{isAr ? 'الصور / الشهادات' : 'Images / Certs'}</div>
                <div className="font-black text-slate-800 text-sm">
                  {summary.mediaFiles} / {summary.certificates}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  {details?.meta?.isZipArchive
                    ? (isAr ? `مضغوط: ${summary.mediaUploadsCount} محلي` : `ZIP: ${summary.mediaUploadsCount} local`)
                    : (isAr ? 'نسخة JSON فقط' : 'JSON only')}
                </div>
              </div>
            </div>
          )}

          {/* Responsive Tabs Bar */}
          {summary && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 pb-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search & Expand Controls */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className={`absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
              <input
                type="text"
                placeholder={isAr ? "ابحث في التبويب الحالي (كورس، درس، امتحان، مهارة، طالب، معلم، صورة)..." : "Search inside current tab..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 ${isAr ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'} text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium`}
              />
            </div>

            {activeTab === 'courses' && treeData.length > 0 && (
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={expandAllCourses}
                  className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer whitespace-nowrap"
                >
                  {isAr ? 'توسيع الكل' : 'Expand All'}
                </button>
                <button
                  type="button"
                  onClick={collapseAllCourses}
                  className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer whitespace-nowrap"
                >
                  {isAr ? 'طي الكل' : 'Collapse'}
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: Courses, Lessons & Attached Exams */}
          {activeTab === 'courses' && (
            <div className="space-y-3">
              {filteredTree.map((course) => {
                const virtual = isSystemVirtualGroup(course.id);
                const courseSelected = !virtual && isSelected(course.id);
                const lessonCount = course.lessonCount ?? course.children?.filter((c) => c.type === 'lesson').length ?? 0;
                const examCount = course.examCount ?? course.children?.filter((c) => c.type === 'exam').length ?? 0;
                return (
                  <div key={course.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                    <div className="flex items-start sm:items-center gap-2.5 p-3.5 sm:p-4 hover:bg-slate-50 transition-colors">
                      <button
                        type="button"
                        onClick={() => toggleExpand(course.id)}
                        className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 cursor-pointer shrink-0 mt-0.5 sm:mt-0"
                      >
                        {expanded.has(course.id) || searchQuery ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`} />}
                      </button>
                      <label className="flex flex-wrap items-center gap-2 flex-1 min-w-0 cursor-pointer">
                        {!virtual && (
                          <input
                            type="checkbox"
                            checked={courseSelected}
                            onChange={(e) => handleSelect(course, e.target.checked)}
                            className="w-4 h-4 sm:w-5 sm:h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer shrink-0"
                          />
                        )}
                        {renderIcon(course.type)}
                        <span className="font-bold text-slate-800 text-sm sm:text-base break-words">{course.title || (isAr ? 'بدون عنوان' : 'Untitled')}</span>

                        {course.deletedAt && (
                          <span className="text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                            {isAr ? 'محذوف في السلة' : 'In Trash'}
                          </span>
                        )}
                        {course.isCentral && (
                          <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600">
                            {isAr ? 'مركزي' : 'Central'}
                          </span>
                        )}
                        {course.schoolName && (
                          <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {course.schoolName}
                          </span>
                        )}
                        {course.grade && (
                          <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                            {course.grade}
                          </span>
                        )}
                        <span className="text-[11px] sm:text-xs font-bold text-emerald-700 px-2 py-0.5 bg-emerald-50 rounded-md">
                          {lessonCount} {isAr ? 'درس' : 'lessons'}
                        </span>
                        <span className="text-[11px] sm:text-xs font-bold text-amber-700 px-2 py-0.5 bg-amber-50 rounded-md">
                          {examCount} {isAr ? 'امتحان' : 'exams'}
                        </span>
                      </label>
                    </div>

                    {(expanded.has(course.id) || searchQuery) && course.children && course.children.length > 0 && (
                      <div className={`bg-slate-50 border-t border-slate-100 py-2 ${isAr ? 'pr-8 sm:pr-12 pl-3 sm:pl-4' : 'pl-8 sm:pl-12 pr-3 sm:pr-4'} space-y-1`}>
                        {course.children.map((child) => {
                          const selected = isSelected(child.id);
                          const parentSelected = courseSelected;
                          const needsTarget = selected && !parentSelected;

                          return (
                            <div key={child.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-2.5 px-2.5 sm:px-3 hover:bg-slate-100/70 rounded-xl transition-colors border-b border-slate-100 last:border-0">
                              <label className="flex flex-wrap items-center gap-2 cursor-pointer min-w-0 flex-1">
                                <input
                                  type="checkbox"
                                  checked={selected || parentSelected}
                                  disabled={parentSelected}
                                  onChange={(e) => handleSelect(child, e.target.checked)}
                                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer disabled:opacity-50 shrink-0"
                                />
                                {renderIcon(child.type)}
                                <span className={`text-xs sm:text-sm font-semibold break-words ${selected || parentSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                  {child.title || (isAr ? 'بدون عنوان' : 'Untitled')}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-500">
                                  {child.type === 'lesson' ? (isAr ? 'درس' : 'Lesson') : (isAr ? 'امتحان' : 'Exam')}
                                </span>
                                {child.deletedAt && (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                                    {isAr ? 'في السلة' : 'Trashed'}
                                  </span>
                                )}
                                {child.type === 'lesson' && (child.hasSlides || (child.questionsCount || 0) > 0 || (child.assignmentsCount || 0) > 0) && (
                                  <span className="text-[10px] font-semibold text-slate-400">
                                    {[
                                      child.hasSlides ? (isAr ? 'شرائح' : 'Slides') : null,
                                      (child.questionsCount || 0) > 0 ? `${child.questionsCount} ${isAr ? 'سؤال' : 'Q'}` : null,
                                      (child.assignmentsCount || 0) > 0 ? `${child.assignmentsCount} ${isAr ? 'واجب' : 'HW'}` : null,
                                    ].filter(Boolean).join(' • ')}
                                  </span>
                                )}
                              </label>

                              {needsTarget && (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto sm:min-w-[240px]">
                                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md whitespace-nowrap">
                                    {isAr ? "أين تريد وضعه؟" : "Move to:"}
                                  </span>
                                  <select
                                    className="flex-1 bg-white border-2 border-indigo-200 rounded-xl text-xs py-2 px-3 outline-none focus:border-indigo-500 font-bold text-slate-700 shadow-sm min-w-0"
                                    onChange={(e) => handleTargetCourseChange(child.id, e.target.value)}
                                    value={selections.find((s) => s.id === child.id)?.targetCourseId || ""}
                                  >
                                    <option value="">{isAr ? "نفس الكورس الأصلي (افتراضي)" : "Original Course (Default)"}</option>
                                    {liveCourses.map((lc) => (
                                      <option key={lc.id} value={lc.id}>{lc.title}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredTree.length === 0 && (
                <div className="py-12 text-center text-slate-400 font-medium">
                  {isAr ? "لا توجد كورسات مطابقة." : "No matching courses found."}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Exams & Modules */}
          {activeTab === 'exams' && (
            <div className="space-y-3">
              {filteredExams.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-medium">
                  {isAr ? "لا توجد امتحانات في هذه النسخة." : "No exams found in this backup."}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredExams.map((exam) => {
                    const checked = isSelected(exam.id);
                    return (
                      <div key={exam.id} className="border border-slate-200 rounded-2xl p-3.5 sm:p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => handleSelect({ id: exam.id, type: 'exam' }, e.target.checked)}
                            className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer shrink-0"
                          />
                          <FileQuestion className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-slate-800 text-sm break-words">{exam.title}</span>
                              {exam.deletedAt && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                                  {isAr ? 'محذوف في السلة' : 'Trashed'}
                                </span>
                              )}
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">{exam.status}</span>
                              {exam.isCentral && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">
                                  {isAr ? 'مركزي' : 'Central'}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-semibold">
                              <span>{exam.courseTitle ? `${isAr ? 'الكورس' : 'Course'}: ${exam.courseTitle}` : (isAr ? 'امتحان مستقل' : 'Standalone Exam')}</span>
                              {exam.folderTitle && <span>{isAr ? 'المجلد' : 'Folder'}: {exam.folderTitle}</span>}
                              {exam.schoolName && <span>{isAr ? 'المدرسة' : 'School'}: {exam.schoolName}</span>}
                              {exam.grade && <span>{exam.grade}</span>}
                            </div>
                          </div>
                        </label>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold shrink-0">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">{exam.questionsCount} {isAr ? 'سؤال' : 'Questions'}</span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">{exam.modulesCount} {isAr ? 'موديول' : 'Modules'}</span>
                          {exam.subExamsCount > 0 && (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700">{exam.subExamsCount} {isAr ? 'فرعي' : 'Sub-exams'}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Skills, Interactive Activities & Competitions */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{isAr ? 'المحاور المهارية والأنشطة التفاعلية (Skills)' : 'Skill Clusters & Interactive Activities'} ({filteredSkills.length})</span>
                </h3>
                {filteredSkills.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 font-medium bg-slate-50 rounded-2xl border border-slate-100">
                    {isAr ? "لا توجد مهارات مسجلة في هذه النسخة." : "No skill clusters in this backup."}
                  </div>
                ) : (
                  filteredSkills.map((sc) => {
                    const checked = isSelected(sc.id);
                    const isOpenSkill = expandedSkills.has(sc.id) || Boolean(searchQuery);
                    return (
                      <div key={sc.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                        <div className="flex items-start sm:items-center gap-2.5 p-3.5 sm:p-4 hover:bg-slate-50">
                          <button type="button" onClick={() => toggleSkillExpand(sc.id)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 cursor-pointer shrink-0">
                            {isOpenSkill ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`} />}
                          </button>
                          <label className="flex flex-wrap items-center gap-2 flex-1 min-w-0 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => handleSelect({ id: sc.id, type: 'skillCluster' }, e.target.checked)}
                              className="w-4 h-4 sm:w-5 sm:h-5 rounded border-slate-300 text-indigo-600 cursor-pointer shrink-0"
                            />
                            <Layers className="w-5 h-5 text-indigo-500 shrink-0" />
                            <span className="font-bold text-slate-800 text-sm break-words">{sc.name}</span>
                            {sc.subject && <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">{sc.subject}</span>}
                            {sc.grade && <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">{sc.grade}</span>}
                            {sc.schoolName && <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">{sc.schoolName}</span>}
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                              {sc.lessonsCount} {isAr ? 'مهارة' : 'skills'} • {sc.activitiesCount} {isAr ? 'نشاط' : 'activities'}
                            </span>
                          </label>
                        </div>
                        {isOpenSkill && sc.lessons.length > 0 && (
                          <div className={`bg-slate-50 border-t border-slate-100 py-2.5 ${isAr ? 'pr-8 sm:pr-12 pl-3 sm:pl-4' : 'pl-8 sm:pl-12 pr-3 sm:pr-4'} space-y-1.5`}>
                            {sc.lessons.map((sl) => (
                              <div key={sl.id} className="flex flex-wrap items-center justify-between gap-2 text-xs py-2 px-3 bg-white rounded-xl border border-slate-100">
                                <span className="font-bold text-slate-700 break-words">{sl.name}</span>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {sl.activityTypes.map((t) => (
                                    <span key={t} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">{t}</span>
                                  ))}
                                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                                    {sl.activitiesCount} {isAr ? 'نشاط' : 'activities'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {filteredCompetitions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{isAr ? 'المسابقات التفاعلية (Competitions)' : 'Competitions'} ({filteredCompetitions.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredCompetitions.map((comp) => (
                      <div key={comp.id} className="border border-slate-200 rounded-2xl p-4 bg-white space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-800 text-sm break-words">{comp.title}</span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-50 text-amber-700 shrink-0">{comp.status}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500 font-semibold">
                          <span>{comp.mode}</span>
                          {comp.subject && <span>• {comp.subject}</span>}
                          {comp.schoolName && <span>• {comp.schoolName}</span>}
                          <span>• {comp.questionsCount} {isAr ? 'سؤال' : 'questions'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Schools, Teachers & Students */}
          {activeTab === 'people' && (
            <div className="space-y-5">
              {(details?.schools?.length || 0) > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                    <School className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{isAr ? 'المدارس الموجودة في النسخة' : 'Schools in Backup'} ({details?.schools?.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {details?.schools?.map((s) => (
                      <div key={s.id} className="border border-slate-200 rounded-2xl p-3.5 sm:p-4 bg-slate-50/70 space-y-2 min-w-0">
                        <div className="font-black text-slate-800 text-sm break-words">{s.name}</div>
                        <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                          <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                            {s.studentsCount} {isAr ? 'طالب' : 'students'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                            {s.teachersCount} {isAr ? 'معلم' : 'teachers'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                            {s.classroomsCount} {isAr ? 'فصل' : 'classrooms'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                            {s.coursesCount} {isAr ? 'كورس' : 'courses'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {['ALL', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRoleFilter(r)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border transition-all ${
                          roleFilter === r
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {r === 'ALL' ? (isAr ? 'الكل' : 'All') : roleLabel(r)} (
                        {r === 'ALL'
                          ? (details?.users?.length || 0)
                          : (details?.summary?.usersByRole?.[r] || 0)}
                        )
                      </button>
                    ))}
                  </div>

                  {(details?.schools?.length || 0) > 0 && (
                    <select
                      value={schoolFilter}
                      onChange={(e) => setSchoolFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none w-full md:w-auto"
                    >
                      <option value="ALL">{isAr ? 'كل المدارس' : 'All Schools'}</option>
                      {details?.schools?.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Mobile User Cards */}
                <div className="grid grid-cols-1 gap-2.5 md:hidden">
                  {filteredUsers.map((u) => (
                    <div key={u.id} className="border border-slate-200 rounded-2xl p-3.5 bg-white space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 break-words">{u.name}</div>
                          <div className="font-mono text-slate-500" dir="ltr">@{u.username}</div>
                        </div>
                        {u.deletedAt ? (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold shrink-0">{isAr ? 'محذوف' : 'Deleted'}</span>
                        ) : u.exposedResetRequired ? (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold shrink-0">EXPOSED_RESET</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold shrink-0">{isAr ? 'نشط' : 'Active'}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">{roleLabel(u.role)}</span>
                        {u.schoolName && <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200">{u.schoolName}</span>}
                        {u.grade && <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200">{u.grade}</span>}
                        {u.specialization && <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200">{u.specialization}</span>}
                      </div>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs font-medium border border-slate-200 rounded-2xl">
                      {isAr ? 'لا يوجد مستخدمون مطابقون.' : 'No matching users.'}
                    </div>
                  )}
                </div>

                {/* Desktop Users Table */}
                <div className="hidden md:block border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <div className="overflow-x-auto max-h-96">
                    <table className={`w-full text-xs ${isAr ? 'text-right' : 'text-left'}`}>
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="px-4 py-3">{isAr ? 'الاسم' : 'Name'}</th>
                          <th className="px-4 py-3">{isAr ? 'اسم المستخدم' : 'Username'}</th>
                          <th className="px-4 py-3">{isAr ? 'الدور' : 'Role'}</th>
                          <th className="px-4 py-3">{isAr ? 'المدرسة / التخصص' : 'School / Info'}</th>
                          <th className="px-4 py-3">{isAr ? 'الحالة' : 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-2.5 font-bold text-slate-800">{u.name}</td>
                            <td className="px-4 py-2.5 font-mono text-slate-600" dir="ltr">@{u.username}</td>
                            <td className="px-4 py-2.5">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">{roleLabel(u.role)}</span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-600 font-semibold">
                              {[u.schoolName, u.grade, u.specialization].filter(Boolean).join(' • ') || '-'}
                            </td>
                            <td className="px-4 py-2.5">
                              {u.deletedAt ? (
                                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">{isAr ? 'محذوف' : 'Deleted'}</span>
                              ) : u.exposedResetRequired ? (
                                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">EXPOSED_RESET</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">{isAr ? 'نشط' : 'Active'}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-medium">
                              {isAr ? 'لا يوجد مستخدمون مطابقون.' : 'No matching users.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Compressed Images / Media & Certificates */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="text-slate-500 font-bold">{isAr ? 'صور وملفات uploads/ داخل الأرشيف' : 'Local Uploads in Archive'}</div>
                  <div className="text-lg font-black text-slate-800 mt-1">{details?.media?.uploadsCount || 0}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="text-slate-500 font-bold">{isAr ? 'ملفات S3/R2 داخل الأرشيف' : 'S3/R2 Media in Archive'}</div>
                  <div className="text-lg font-black text-slate-800 mt-1">{details?.media?.s3Count || 0}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="text-slate-500 font-bold">{isAr ? 'الشهادات المحفوظة' : 'Saved Certificates'}</div>
                  <div className="text-lg font-black text-slate-800 mt-1">{summary?.certificates || 0}</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                <div className="text-xs font-black text-slate-700 mb-3">
                  {isAr ? 'ملفات الصور والمرفقات المضمنة في هذا الأرشيف' : 'Image & Attachment Files in Archive'}
                </div>
                {filteredMediaFiles.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium py-4 text-center">
                    {details?.meta?.isZipArchive
                      ? (isAr ? 'لا توجد صور أو ملفات مطابقة داخل هذا الأرشيف.' : 'No matching image files inside this archive.')
                      : (isAr ? 'هذه نسخة JSON لقاعدة البيانات فقط ولا تحتوي على مجلد صور مضغوط.' : 'This is a JSON-only snapshot without a compressed uploads folder.')}
                  </p>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-1 font-mono text-xs text-slate-600" dir="ltr">
                    {filteredMediaFiles.map((file) => (
                      <div key={file} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 break-all">
                        {file}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pinned Footer */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs sm:text-sm font-bold text-slate-500 text-center sm:text-start">
            <div>
              {isAr ? "تم تحديد للاستعادة" : "Selected to restore"}:{" "}
              <span className="text-indigo-600 bg-indigo-100 px-3 py-1 rounded-lg text-base font-black inline-block">{selections.length}</span>
            </div>
            {selections.some((s) => s.type === 'lesson') && (
              <p className="text-[11px] font-semibold text-slate-400 mt-1">
                {isAr
                  ? 'إذا كان الدرس موجوداً حالياً بنفس المعرف، يُضاف كنسخة إضافية بمعرف جديد دون المساس بالموجود.'
                  : 'If a selected lesson ID already exists in the DB, it is added as a new copy with a new ID without overwriting.'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={isRestoring}
              className="flex-1 sm:flex-none px-5 py-3 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer text-sm"
            >
              {isAr ? "إغلاق" : "Close"}
            </button>
            <button
              onClick={handleConfirm}
              disabled={selections.length === 0 || isRestoring}
              className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 sm:px-8 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isAr ? "جاري الاستعادة..." : "Restoring..."}</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>{isAr ? "استعادة التحديد" : "Restore Selected"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
