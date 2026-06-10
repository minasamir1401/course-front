"use client";

import { API_URL } from '@/lib/api';
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Users, GraduationCap, Building2, ClipboardList, Shield,
  Search, Plus, Filter, MoreVertical, Edit2, Trash2,
  Key, X, Building, Users2, Heart, UserCheck, Activity,
  BarChart3, ArrowLeft, ChevronRight, Sparkles, Phone,
  Mail, MapPin, CheckCircle, AlertCircle, Clock, BookOpen
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { useNotification } from "@/context/NotificationContext";
import { startImpersonation } from '@/lib/auth';
import { useLanguage } from "@/contexts/LanguageContext";

type TabType = 'STUDENTS' | 'TEACHERS' | 'ADMINS' | 'COURSES';

export default function SchoolManagementPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useNotification();
  const { t, language } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<TabType>('STUDENTS');
  const [school, setSchool] = useState<any>(null);
  const [schoolStats, setSchoolStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: "",
    username: "",
    password: "",
    phone: "",
    grade: "",
    specialization: "",
    classroomId: "",
    parentId: "",
    role: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState("ALL");
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    const token = localStorage.getItem("super_admin_token");
    if (!token) {
      router.push("/super-admin/login");
      return;
    }
    fetchData();
  }, [id, activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("super_admin_token");
    try {
      // Fetch School Info
      const schoolRes = await fetch(`${API_URL}/admin/schools`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (schoolRes.ok) {
        const data = await schoolRes.json();
        const schoolsList = Array.isArray(data.schools) ? data.schools : (Array.isArray(data) ? data : []);
        const currentSchool = schoolsList.find((s: any) => s.id === id); 
        setSchool(currentSchool);
      }

      // Fetch School Stats
      const statsRes = await fetch(`${API_URL}/admin/schools/${id}/stats`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (statsRes.ok) setSchoolStats(await statsRes.json());

      // Fetch Users based on tab
      const roleMap: Record<TabType, string> = {
        STUDENTS: 'STUDENT',
        TEACHERS: 'TEACHER',
        ADMINS: 'SCHOOL_ADMIN',
        COURSES: 'COURSE'
      };

      if (activeTab === 'COURSES') {
        const coursesRes = await fetch(`${API_URL}/courses?schoolId=${id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (coursesRes.ok) {
          const data = await coursesRes.json();
          setCourses(Array.isArray(data.courses) ? data.courses : (Array.isArray(data) ? data : []));
        }
      } else {
        const usersRes = await fetch(`${API_URL}/admin/users?schoolId=${id}&role=${roleMap[activeTab]}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(Array.isArray(data.users) ? data.users : (Array.isArray(data) ? data : []));
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Manual generation of unique English credentials
  const generateCredentials = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let randomUser = '';
    for (let i = 0; i < 6; i++) {
      randomUser += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const timestamp = Date.now().toString().slice(-4);
    const generatedUsername = `user_${randomUser}${timestamp}`;
    const generatedPassword = Math.random().toString(36).slice(-8).toUpperCase();
    
    setFormData((prev: any) => ({
      ...prev,
      username: generatedUsername,
      password: generatedPassword
    }));
    showToast(language === 'ar' ? "تم توليد بيانات دخول فريدة بالإنجليزية" : "Unique English credentials generated", 'success');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem("super_admin_token");
    
    try {
      const roleMap: Record<string, string> = {
        STUDENTS: 'STUDENT',
        TEACHERS: 'TEACHER',
        ADMINS: 'SCHOOL_ADMIN',
        COURSES: 'COURSE'
      };

      const endpoint = '/admin/users';
      const url = modalMode === 'EDIT' ? `${API_URL}${endpoint}/${editingUserId}` : `${API_URL}${endpoint}`;
      const method = modalMode === 'EDIT' ? 'PUT' : 'POST';

      const cleanData = { ...formData };
      if (cleanData.classroomId === "") delete cleanData.classroomId;
      if (cleanData.parentId === "") delete cleanData.parentId;
      if (!cleanData.grade) delete cleanData.grade;

      const body = { ...cleanData, schoolId: id, role: roleMap[activeTab] };

      const res = await fetch(url, {
        method: method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        showToast(modalMode === 'EDIT' ? (language === 'ar' ? "تم التعديل بنجاح" : "Updated successfully") : (language === 'ar' ? "تمت الإضافة بنجاح" : "Added successfully"), 'success');
        setIsModalOpen(false);
        setFormData({ name: "", username: "", password: "", phone: "", grade: "", specialization: "", classroomId: "", parentId: "" });
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || (language === 'ar' ? "فشل في العملية" : "Action failed"), 'error');
      }
    } catch (error) {
      showToast(language === 'ar' ? "خطأ في الاتصال بالسيرفر" : "Server connection error", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    const confirmed = window.confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا السجل؟" : "Are you sure you want to delete this record?");
    if (!confirmed) return;

    const token = localStorage.getItem("super_admin_token");
    const endpoint = '/admin/users';

    try {
      const res = await fetch(`${API_URL}${endpoint}/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        showToast(language === 'ar' ? "تم الحذف بنجاح" : "Deleted successfully", 'success');
        fetchData();
      } else {
        showToast(language === 'ar' ? "فشل الحذف" : "Failed to delete", 'error');
      }
    } catch (error) {
      showToast(language === 'ar' ? "خطأ في الاتصال" : "Connection error", 'error');
    }
  };

  const handleEditOpen = (user: any) => {
    setModalMode('EDIT');
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      username: user.username,
      password: "", // Don't pre-fill password for security
      phone: user.phone || "",
      grade: user.grade || "",
      specialization: user.specialization || "",
      classroomId: user.classroomId || "",
      parentId: user.parentId || ""
    });
    setIsModalOpen(true);
  };

  const handleImpersonate = async (user: any) => {
    const token = localStorage.getItem("super_admin_token");
    
    try {
      const res = await fetch(`${API_URL}/admin/impersonate/${user.id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (res.ok) {
        const data = await res.json();
        
        // Use the centralized helper
        startImpersonation(data.token, data.user, user.role);
        
        // Redirect
        if (user.role === 'STUDENT' || user.role === 'TEACHER') {
          router.push("/dashboard");
        } else if (user.role === 'SCHOOL_ADMIN') {
          router.push("/school-admin");
        }
        
        showToast(language === 'ar' ? `تم الدخول بنجاح كـ ${user.name}` : `Successfully logged in as ${user.name}`, 'success');
      }
    } catch (error) {
      showToast(language === 'ar' ? "فشل الدخول كمسخدم" : "Failed to impersonate user", 'error');
    }
  };

  const filteredData = (Array.isArray(activeTab === 'COURSES' ? courses : users) ? (activeTab === 'COURSES' ? courses : users) : []).filter(item => {
    const nameToSearch = (item.name || item.title || "").toLowerCase();
    const usernameToSearch = (item.username || "").toLowerCase();
    const matchesSearch = nameToSearch.includes(searchTerm.toLowerCase()) || 
                         usernameToSearch.includes(searchTerm.toLowerCase());
    const matchesGrade = filterGrade === "ALL" || item.grade === filterGrade;
    const matchesStatus = filterStatus === "ALL" || (activeTab === 'COURSES' ? true : item.status === filterStatus);
    return matchesSearch && matchesGrade && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="text-slate-800 space-y-8 pb-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* Header with Navigation */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/super-admin/schools" className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-slate-200/50">
              <ArrowLeft className={`w-5 h-5 ${language === 'en' ? 'rotate-180' : ''}`} />
            </Link>
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{school?.name || t('superAdmin.schoolDetails.title')}</h1>
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mt-1">
                <Building2 className="w-4 h-4" />
                {t('superAdmin.schoolDetails.controlPanel')}
              </div>
            </div>
          </div>

          {/* School Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatSmall title={t('superAdmin.schoolDetails.students')} value={schoolStats?.students || 0} icon={<GraduationCap />} color="blue" />
            <StatSmall title={t('superAdmin.schoolDetails.teachers')} value={schoolStats?.teachers || 0} icon={<Users />} color="purple" />
            <StatSmall title={t('superAdmin.schoolDetails.admins')} value={schoolStats?.admins || 0} icon={<Shield />} color="emerald" />
          </div>
        </div>

        {/* Management Tabs */}
        <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-100 rounded-2xl mb-8 no-scrollbar border border-slate-200/30">
          <TabButton active={activeTab === 'STUDENTS'} onClick={() => setActiveTab('STUDENTS')} icon={<GraduationCap size={18} />} label={t('superAdmin.schoolDetails.studentsTab')} />
          <TabButton active={activeTab === 'TEACHERS'} onClick={() => setActiveTab('TEACHERS')} icon={<Users size={18} />} label={t('superAdmin.schoolDetails.teachersTab')} />
          <TabButton active={activeTab === 'ADMINS'} onClick={() => setActiveTab('ADMINS')} icon={<Shield size={18} />} label={t('superAdmin.schoolDetails.adminsTab')} />
          <TabButton active={activeTab === 'COURSES'} onClick={() => setActiveTab('COURSES')} icon={<BookOpen size={18} />} label={t('superAdmin.schoolDetails.coursesTab')} />
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
              <div className="relative flex-1 min-w-[240px]">
                <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400`} />
                <input 
                  type="text" 
                  placeholder={t('superAdmin.schoolDetails.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} outline-none focus:bg-white focus:border-indigo-500 transition-all text-slate-950 font-medium`}
                />
              </div>
              <div className="flex items-center gap-2">
                <select 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500"
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                >
                  <option value="ALL">{t('superAdmin.schoolDetails.allGrades')}</option>
                  <optgroup label={language === 'ar' ? "المرحلة الثانوية" : "High School"}>
                    <option value="الصف الأول الثانوي">{language === 'ar' ? "الأول الثانوي" : "Grade 10"}</option>
                    <option value="الصف الثاني الثانوي">{language === 'ar' ? "الثاني الثانوي" : "Grade 11"}</option>
                    <option value="الصف الثالث الثانوي">{language === 'ar' ? "الثالث الثانوي" : "Grade 12"}</option>
                  </optgroup>
                  <optgroup label={language === 'ar' ? "المرحلة الإعدادية" : "Middle School"}>
                    <option value="الصف الأول الإعدادي">{language === 'ar' ? "الأول الإعدادي" : "Grade 7"}</option>
                    <option value="الصف الثاني الإعدادي">{language === 'ar' ? "الثاني الإعدادي" : "Grade 8"}</option>
                    <option value="الصف الثالث الإعدادي">{language === 'ar' ? "الثالث الإعدادي" : "Grade 9"}</option>
                  </optgroup>
                  <optgroup label={language === 'ar' ? "المرحلة الابتدائية" : "Elementary School"}>
                    <option value="الصف الأول الابتدائي">{language === 'ar' ? "الأول الابتدائي" : "Grade 1"}</option>
                    <option value="الصف الثاني الابتدائي">{language === 'ar' ? "الثاني الابتدائي" : "Grade 2"}</option>
                    <option value="الصف الثالث الابتدائي">{language === 'ar' ? "الثالث الابتدائي" : "Grade 3"}</option>
                    <option value="الصف الرابع الابتدائي">{language === 'ar' ? "الرابع الابتدائي" : "Grade 4"}</option>
                    <option value="الصف الخامس الابتدائي">{language === 'ar' ? "الخامس الابتدائي" : "Grade 5"}</option>
                    <option value="الصف السادس الابتدائي">{language === 'ar' ? "السادس الابتدائي" : "Grade 6"}</option>
                  </optgroup>
                </select>
                <button className="p-3 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200">
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>

            <button 
              onClick={() => {
                if (activeTab === 'COURSES') {
                  router.push(`/super-admin/courses/create?schoolId=${id}`);
                  return;
                }
                setModalMode('ADD');
                setEditingUserId(null);
                setFormData({ name: "", username: "", password: "", phone: "", grade: "", specialization: "", classroomId: "", parentId: "" });
                setIsModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:shadow-lg hover:shadow-indigo-600/10 transition-all w-full lg:w-auto justify-center cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              {activeTab === 'STUDENTS' ? t('superAdmin.schoolDetails.addStudent') : activeTab === 'TEACHERS' ? t('superAdmin.schoolDetails.addTeacher') : activeTab === 'COURSES' ? t('superAdmin.schoolDetails.addCourse') : t('superAdmin.schoolDetails.addNewRecord')}
            </button>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-100 w-full max-w-xl rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">
                  {modalMode === 'EDIT' ? t('superAdmin.schoolDetails.editInfo') : (activeTab === 'STUDENTS' ? t('superAdmin.schoolDetails.addStudent') : activeTab === 'TEACHERS' ? t('superAdmin.schoolDetails.addTeacher') : t('superAdmin.schoolDetails.addNewRecord'))}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>

              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-slate-500 mb-1">{t('superAdmin.schoolDetails.fullName')}</label>
                    <input 
                      type="text" required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                      placeholder={t('superAdmin.schoolDetails.namePlaceholder')}
                    />
                  </div>

                  {modalMode === 'ADD' && (
                    <div className="col-span-full mb-2">
                      <button 
                        type="button"
                        onClick={generateCredentials}
                        className="w-full bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 text-indigo-600 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        {t('superAdmin.schoolDetails.generateCredentials')}
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    <label className="block text-sm font-bold text-slate-500 mb-1">{t('superAdmin.schoolDetails.username')}</label>
                    <input 
                      type="text" required
                      readOnly={modalMode === 'EDIT'}
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all font-mono ${modalMode === 'EDIT' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="username" dir="ltr"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-bold text-slate-500 mb-1">{modalMode === 'EDIT' ? t('superAdmin.schoolDetails.newPassword') : t('superAdmin.schoolDetails.password')}</label>
                    <input 
                      type="text" required={modalMode === 'ADD'}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                      placeholder={modalMode === 'EDIT' ? t('superAdmin.schoolDetails.passwordHelper') : "********"}
                    />
                  </div>

                  {activeTab === 'TEACHERS' && (
                    <>
                      <div className="col-span-full">
                        <label className="block text-sm font-bold text-slate-500 mb-1">{t('superAdmin.schoolDetails.specialization')}</label>
                        <select 
                          required
                          value={formData.specialization}
                          onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                        >
                          <option value="">{t('superAdmin.schoolDetails.selectSpecialization')}</option>
                          <option value="اللغة العربية">{language === 'ar' ? "اللغة العربية" : "Arabic"}</option>
                          <option value="اللغة الإنجليزية">{language === 'ar' ? "اللغة الإنجليزية" : "English"}</option>
                          <option value="الرياضيات">{language === 'ar' ? "الرياضيات" : "Mathematics"}</option>
                          <option value="العلوم">{language === 'ar' ? "العلوم" : "Sciences"}</option>
                          <option value="الدراسات الاجتماعية">{language === 'ar' ? "الدراسات الاجتماعية" : "Social Studies"}</option>
                          <option value="الفيزياء">{language === 'ar' ? "الفيزياء" : "Physics"}</option>
                          <option value="الكيمياء">{language === 'ar' ? "الكيمياء" : "Chemistry"}</option>
                          <option value="الأحياء">{language === 'ar' ? "الأحياء" : "Biology"}</option>
                          <option value="الحاسب الآلي">{language === 'ar' ? "الحاسب الآلي" : "Computer Science"}</option>
                          <option value="التربية الدينية">{language === 'ar' ? "التربية الدينية" : "Religious Education"}</option>
                          <option value="اللغة الفرنسية">{language === 'ar' ? "اللغة الفرنسية" : "French"}</option>
                          <option value="اللغة الألمانية">{language === 'ar' ? "اللغة الألمانية" : "German"}</option>
                          <option value="اللغة الإيطالية">{language === 'ar' ? "اللغة الإيطالية" : "Italian"}</option>
                          <option value="الفلسفة">{language === 'ar' ? "الفلسفة" : "Philosophy"}</option>
                          <option value="علم النفس">{language === 'ar' ? "علم النفس" : "Psychology"}</option>
                        </select>
                      </div>
                      <div className="col-span-full">
                        <label className="block text-sm font-bold text-slate-500 mb-1">{t('superAdmin.schoolDetails.gradeLevel')}</label>
                        <select 
                          required
                          value={formData.grade}
                          onChange={(e) => setFormData({...formData, grade: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all appearance-none"
                        >
                          <option value="">{t('superAdmin.schoolDetails.selectGrade')}</option>
                          <optgroup label={language === 'ar' ? "المرحلة الثانوية" : "High School"}>
                            <option value="الصف الأول الثانوي">{language === 'ar' ? "الأول الثانوي" : "Grade 10"}</option>
                            <option value="الصف الثاني الثانوي">{language === 'ar' ? "الثاني الثانوي" : "Grade 11"}</option>
                            <option value="الصف الثالث الثانوي">{language === 'ar' ? "الثالث الثانوي" : "Grade 12"}</option>
                          </optgroup>
                          <optgroup label={language === 'ar' ? "المرحلة الإعدادية" : "Middle School"}>
                            <option value="الصف الأول الإعدادي">{language === 'ar' ? "الأول الإعدادي" : "Grade 7"}</option>
                            <option value="الصف الثاني الإعدادي">{language === 'ar' ? "الثاني الإعدادي" : "Grade 8"}</option>
                            <option value="الصف الثالث الإعدادي">{language === 'ar' ? "الثالث الإعدادي" : "Grade 9"}</option>
                          </optgroup>
                          <optgroup label={language === 'ar' ? "المرحلة الابتدائية" : "Elementary School"}>
                            <option value="الصف الأول الابتدائي">{language === 'ar' ? "الأول الابتدائي" : "Grade 1"}</option>
                            <option value="الصف الثاني الابتدائي">{language === 'ar' ? "الثاني الابتدائي" : "Grade 2"}</option>
                            <option value="الصف الثالث الابتدائي">{language === 'ar' ? "الثالث الابتدائي" : "Grade 3"}</option>
                            <option value="الصف الرابع الابتدائي">{language === 'ar' ? "الرابع الابتدائي" : "Grade 4"}</option>
                            <option value="الصف الخامس الابتدائي">{language === 'ar' ? "الخامس الابتدائي" : "Grade 5"}</option>
                            <option value="الصف السادس الابتدائي">{language === 'ar' ? "السادس الابتدائي" : "Grade 6"}</option>
                          </optgroup>
                        </select>
                      </div>
                    </>
                  )}

                  {activeTab === 'STUDENTS' && (
                    <div className="col-span-full">
                      <label className="block text-sm font-bold text-slate-500 mb-1">{t('superAdmin.schoolDetails.gradeLevel')}</label>
                      <select 
                        required
                        value={formData.grade}
                        onChange={(e) => setFormData({...formData, grade: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all appearance-none"
                      >
                        <option value="">{t('superAdmin.schoolDetails.selectGrade')}</option>
                        <optgroup label={language === 'ar' ? "المرحلة الابتدائية" : "Elementary School"}>
                          <option value="الصف الأول الابتدائي">{language === 'ar' ? "الأول الابتدائي" : "Grade 1"}</option>
                          <option value="الصف الثاني الابتدائي">{language === 'ar' ? "الثاني الابتدائي" : "Grade 2"}</option>
                          <option value="الصف الثالث الابتدائي">{language === 'ar' ? "الثالث الابتدائي" : "Grade 3"}</option>
                          <option value="الصف الرابع الابتدائي">{language === 'ar' ? "الرابع الابتدائي" : "Grade 4"}</option>
                          <option value="الصف الخامس الابتدائي">{language === 'ar' ? "الخامس الابتدائي" : "Grade 5"}</option>
                          <option value="الصف السادس الابتدائي">{language === 'ar' ? "السادس الابتدائي" : "Grade 6"}</option>
                        </optgroup>
                        <optgroup label={language === 'ar' ? "المرحلة الإعدادية" : "Middle School"}>
                          <option value="الصف الأول الإعدادي">{language === 'ar' ? "الأول الإعدادي" : "Grade 7"}</option>
                          <option value="الصف الثاني الإعدادي">{language === 'ar' ? "الثاني الإعدادي" : "Grade 8"}</option>
                          <option value="الصف الثالث الإعدادي">{language === 'ar' ? "الثالث الإعدادي" : "Grade 9"}</option>
                        </optgroup>
                        <optgroup label={language === 'ar' ? "المرحلة الثانوية" : "High School"}>
                          <option value="الصف الأول الثانوي">{language === 'ar' ? "الأول الثانوي" : "Grade 10"}</option>
                          <option value="الصف الثاني الثانوي">{language === 'ar' ? "الثاني الثانوي" : "Grade 11"}</option>
                          <option value="الصف الثالث الثانوي">{language === 'ar' ? "الثالث الثانوي" : "Grade 12"}</option>
                        </optgroup>
                      </select>
                    </div>
                  )}

                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-slate-500 mb-1">{t('superAdmin.schoolDetails.phone')}</label>
                    <input 
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all text-left"
                      placeholder="01xxxxxxxxx"
                    />
                  </div>
                </div>

                <button 
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl mt-4 transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/10 cursor-pointer"
                >
                  {isSubmitting ? t('superAdmin.schoolDetails.saving') : t('superAdmin.schoolDetails.save')}
                </button>
              </form>
            </div>
          </div>
        )}
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'} border-collapse`}>
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  {activeTab === 'COURSES' ? (
                    <>
                      <th className="px-6 py-4">{t('superAdmin.schoolDetails.courseName')}</th>
                      <th className="px-6 py-4">{t('superAdmin.schoolDetails.gradeLevel')}</th>
                      <th className="px-6 py-4">{t('superAdmin.schoolDetails.subject')}</th>
                      <th className="px-6 py-4">{t('superAdmin.schoolDetails.lessonsCount')}</th>
                      <th className="px-6 py-4 text-center">{t('superAdmin.schoolDetails.actions')}</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4">{t('superAdmin.schoolDetails.user')}</th>
                      <th className="px-6 py-4">{t('superAdmin.schoolDetails.accountData')}</th>
                      <th className="px-6 py-4">{t('superAdmin.schoolDetails.academicDetails')}</th>
                      <th className="px-6 py-4">{t('superAdmin.schoolDetails.status')}</th>
                      <th className="px-6 py-4 text-center">{t('superAdmin.schoolDetails.actions')}</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!isLoading && activeTab === 'COURSES' && filteredData.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-base">{course.title}</p>
                          <p className="text-slate-400 text-[10px]">{course.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-bold text-sm">
                      {course.grade}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {course.subject}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600 font-bold">
                        <ClipboardList className="w-4 h-4 text-purple-500" />
                        {course._count?.lessons || 0} {t('superAdmin.schoolDetails.lessons')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link 
                          href={`/courses/${course.id}`}
                          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all"
                        >
                          <Activity className="w-3 h-3" />
                          <span>{t('superAdmin.schoolDetails.viewContent')}</span>
                        </Link>
                        <Link 
                          href={`/super-admin/courses/edit?id=${course.id}&schoolId=${id}`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all border bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border-blue-100"
                        >
                          <Edit2 size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && activeTab !== 'COURSES' && filteredData.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img 
                            src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`} 
                            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 group-hover:ring-indigo-500/50 transition-all"
                            alt=""
                          />
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-base">{user.name}</p>
                          <p className="text-slate-400 text-xs font-mono" dir="ltr">{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
                          <Phone className="w-3 h-3 text-purple-500" />
                          {user.phone || t('superAdmin.schoolDetails.noPhone')}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                          <Key className="w-3 h-3" />
                          {user.plainPassword || "********"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black border border-blue-100">
                          {user.role === 'TEACHER' ? user.specialization : user.grade || (language === 'ar' ? "غير محدد" : "Not Specified")}
                        </span>
                        <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                          <Activity className="w-3 h-3" />
                          {user.role === 'TEACHER' ? user.grade : user.classroom?.name || t('superAdmin.schoolDetails.noClassroom')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {user.status === 'ACTIVE' ? t('superAdmin.schoolDetails.active') : t('superAdmin.schoolDetails.suspended')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleImpersonate(user)}
                          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-lg shadow-indigo-600/10 active:scale-95 group/btn cursor-pointer"
                          title="Login as User"
                        >
                          <Sparkles className="w-3 h-3 group-hover/btn:animate-pulse" />
                          <span>{t('superAdmin.schoolDetails.directLogin')}</span>
                        </button>
                        
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleEditOpen(user)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all border bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border-blue-100 cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(user.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all border bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border-red-100 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                          <ActionBtn icon={<MoreVertical size={14} />} color="slate" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isLoading && filteredData.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-600">{t('superAdmin.schoolDetails.noMatchingData')}</h3>
              <p className="text-slate-400 text-sm mt-1">{t('superAdmin.schoolDetails.verifySearchFilters')}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Sub-components
function StatSmall({ title, value, icon, color }: any) {
  const colors: any = {
    blue: "from-blue-500 to-cyan-500 text-blue-400",
    purple: "from-purple-500 to-indigo-500 text-purple-400",
    emerald: "from-emerald-500 to-teal-500 text-emerald-400",
    pink: "from-pink-500 to-rose-500 text-pink-400",
  };
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 group hover:shadow-md hover:shadow-slate-100/50 transition-all">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]} flex items-center justify-center text-white shadow-lg`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <h4 className="text-xl font-black text-slate-800 leading-none mt-1">{value}</h4>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
    >
      {icon}
      {label}
    </button>
  );
}

function ActionBtn({ icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border-blue-100",
    red: "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border-red-100",
    slate: "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 border-slate-200/50",
  };
  return (
    <button className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border cursor-pointer ${colors[color]}`}>
      {icon}
    </button>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-6"><div className="h-10 bg-slate-100 rounded-xl w-32"></div></td>
      <td className="px-6 py-6"><div className="h-8 bg-slate-100 rounded-xl w-24"></div></td>
      <td className="px-6 py-6"><div className="h-8 bg-slate-100 rounded-xl w-20"></div></td>
      <td className="px-6 py-6"><div className="h-8 bg-slate-100 rounded-xl w-16"></div></td>
      <td className="px-6 py-4"><div className="h-10 bg-slate-100 rounded-xl w-full"></div></td>
    </tr>
  );
}

function LayoutDashboard({ size }: any) {
  return <Building2 size={size} />;
}
