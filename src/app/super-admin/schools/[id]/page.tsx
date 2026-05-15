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
import SuperAdminSidebar from "@/components/SuperAdminSidebar";
import { useNotification } from "@/context/NotificationContext";
import { startImpersonation } from '@/lib/auth';

type TabType = 'STUDENTS' | 'TEACHERS' | 'ADMINS' | 'COURSES';

export default function SchoolManagementPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useNotification();
  
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
    showToast("تم توليد بيانات فريدة بالإنجليزية", 'success');
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
        showToast(modalMode === 'EDIT' ? "تم التعديل بنجاح" : "تمت الإضافة بنجاح", 'success');
        setIsModalOpen(false);
        setFormData({ name: "", username: "", password: "", phone: "", grade: "", specialization: "", classroomId: "", parentId: "" });
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || "فشل في العملية", 'error');
      }
    } catch (error) {
      showToast("خطأ في الاتصال بالسيرفر", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    const confirmed = window.confirm("هل أنت متأكد من حذف هذا السجل؟");
    if (!confirmed) return;

    const token = localStorage.getItem("super_admin_token");
    const endpoint = '/admin/users';

    try {
      const res = await fetch(`${API_URL}${endpoint}/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        showToast("تم الحذف بنجاح", 'success');
        fetchData();
      } else {
        showToast("فشل الحذف", 'error');
      }
    } catch (error) {
      showToast("خطأ في الاتصال", 'error');
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
        
        showToast(`تم الدخول بنجاح كـ ${user.name}`, 'success');
      }
    } catch (error) {
      showToast("فشل الدخول كمسخدم", 'error');
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
    <div className="min-h-screen bg-[#0a0a14] text-slate-200" dir="rtl">
      <SuperAdminSidebar />

      <main className="lg:mr-64 p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8 transition-all duration-300">
        
        {/* Header with Navigation */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/super-admin/schools" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{school?.name || "إدارة المدرسة"}</h1>
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mt-1">
                <Building2 className="w-4 h-4" />
                لوحة التحكم المركزية للمدرسة
              </div>
            </div>
          </div>

          {/* School Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatSmall title="الطلاب" value={schoolStats?.students || 0} icon={<GraduationCap />} color="blue" />
            <StatSmall title="المدرسين" value={schoolStats?.teachers || 0} icon={<Users />} color="purple" />
            <StatSmall title="المشرفين" value={schoolStats?.admins || 0} icon={<Shield />} color="emerald" />
          </div>
        </div>

        {/* Management Tabs */}
        <div className="flex overflow-x-auto gap-2 p-1 bg-white/5 rounded-2xl mb-8 no-scrollbar border border-white/5">
          <TabButton active={activeTab === 'STUDENTS'} onClick={() => setActiveTab('STUDENTS')} icon={<GraduationCap size={18} />} label="الطلاب" />
          <TabButton active={activeTab === 'TEACHERS'} onClick={() => setActiveTab('TEACHERS')} icon={<Users size={18} />} label="المدرسين" />
          <TabButton active={activeTab === 'ADMINS'} onClick={() => setActiveTab('ADMINS')} icon={<Shield size={18} />} label="المشرفين والمديرين" />
          <TabButton active={activeTab === 'COURSES'} onClick={() => setActiveTab('COURSES')} icon={<BookOpen size={18} />} label="الكورسات والمحتوى" />
        </div>

        {/* Action Bar */}
        <div className="bg-[#0f0f1d] rounded-3xl p-6 border border-white/5 shadow-xl mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="البحث بالاسم، الكود، أو رقم الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pr-12 pl-4 outline-none focus:border-purple-500/50 transition-all text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <select 
                  className="bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-purple-500"
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                >
                  <option value="ALL" className="bg-[#0a0a14] text-white">كل المراحل</option>
                  <optgroup label="المرحلة الثانوية" className="bg-[#0a0a14] text-white">
                    <option value="الصف الأول الثانوي" className="text-white">الأول الثانوي</option>
                    <option value="الصف الثاني الثانوي" className="text-white">الثاني الثانوي</option>
                    <option value="الصف الثالث الثانوي" className="text-white">الثالث الثانوي</option>
                  </optgroup>
                  <optgroup label="المرحلة الإعدادية" className="bg-[#0a0a14] text-white">
                    <option value="الصف الأول الإعدادي" className="text-white">الأول الإعدادي</option>
                    <option value="الصف الثاني الإعدادي" className="text-white">الثاني الإعدادي</option>
                    <option value="الصف الثالث الإعدادي" className="text-white">الثالث الإعدادي</option>
                  </optgroup>
                  <optgroup label="المرحلة الابتدائية" className="bg-[#0a0a14] text-white">
                    <option value="الصف الأول الابتدائي" className="text-white">الأول الابتدائي</option>
                    <option value="الصف الثاني الابتدائي" className="text-white">الثاني الابتدائي</option>
                    <option value="الصف الثالث الابتدائي" className="text-white">الثالث الابتدائي</option>
                    <option value="الصف الرابع الابتدائي" className="text-white">الرابع الابتدائي</option>
                    <option value="الصف الخامس الابتدائي" className="text-white">الخامس الابتدائي</option>
                    <option value="الصف السادس الابتدائي" className="text-white">السادس الابتدائي</option>
                  </optgroup>
                </select>
                <button className="p-3 rounded-xl bg-white/5 text-slate-400 hover:text-white border border-white/5">
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
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/20 transition-all w-full lg:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              {activeTab === 'STUDENTS' ? "إضافة طالب جديد" : activeTab === 'TEACHERS' ? "إضافة مدرس" : activeTab === 'COURSES' ? "إضافة كورس جديد" : "إضافة سجل جديد"}
            </button>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0f0f1d] border border-white/10 w-full max-w-xl rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {modalMode === 'EDIT' ? "تعديل البيانات" : (activeTab === 'STUDENTS' ? "إضافة طالب جديد" : activeTab === 'TEACHERS' ? "إضافة مدرس جديد" : "إضافة سجل جديد")}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X /></button>
              </div>

              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-slate-400 mb-1">الاسم الكامل</label>
                    <input 
                      type="text" required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-purple-500 transition-all"
                      placeholder="مثال: محمد أحمد"
                    />
                  </div>

                  {modalMode === 'ADD' && (
                    <div className="col-span-full mb-2">
                      <button 
                        type="button"
                        onClick={generateCredentials}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-purple-400 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all"
                      >
                        <Sparkles className="w-3 h-3" />
                        توليد بيانات دخول فريدة بالإنجليزية
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    <label className="block text-sm font-bold text-slate-400 mb-1">اسم المستخدم</label>
                    <input 
                      type="text" required
                      readOnly={modalMode === 'EDIT'}
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className={`w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-purple-500 transition-all font-mono ${modalMode === 'EDIT' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="username" dir="ltr"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-bold text-slate-400 mb-1">{modalMode === 'EDIT' ? "كلمة المرور الجديدة" : "كلمة المرور"}</label>
                    <input 
                      type="text" required={modalMode === 'ADD'}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-purple-500 transition-all"
                      placeholder={modalMode === 'EDIT' ? "اتركها فارغة لعدم التغيير" : "********"}
                    />
                  </div>

                  {activeTab === 'TEACHERS' && (
                    <>
                      <div className="col-span-full">
                        <label className="block text-sm font-bold text-slate-400 mb-1">التخصص الدراسي (المادة)</label>
                        <select 
                          required
                          value={formData.specialization}
                          onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-purple-500 transition-all"
                        >
                          <option value="" className="text-black">اختر التخصص</option>
                          <option value="اللغة العربية" className="text-black">اللغة العربية</option>
                          <option value="اللغة الإنجليزية" className="text-black">اللغة الإنجليزية</option>
                          <option value="الرياضيات" className="text-black">الرياضيات</option>
                          <option value="العلوم" className="text-black">العلوم</option>
                          <option value="الدراسات الاجتماعية" className="text-black">الدراسات الاجتماعية</option>
                          <option value="الفيزياء" className="text-black">الفيزياء</option>
                          <option value="الكيمياء" className="text-black">الكيمياء</option>
                          <option value="الأحياء" className="text-black">الأحياء</option>
                          <option value="الحاسب الآلي" className="text-black">الحاسب الآلي</option>
                          <option value="التربية الدينية" className="text-black">التربية الدينية</option>
                          <option value="اللغة الفرنسية" className="text-black">اللغة الفرنسية</option>
                          <option value="اللغة الألمانية" className="text-black">اللغة الألمانية</option>
                          <option value="اللغة الإيطالية" className="text-black">اللغة الإيطالية</option>
                          <option value="الفلسفة" className="text-black">الفلسفة</option>
                          <option value="علم النفس" className="text-black">علم النفس</option>
                        </select>
                      </div>
                      <div className="col-span-full">
                        <label className="block text-sm font-bold text-slate-400 mb-1">الصف الدراسي / المرحلة</label>
                        <select 
                          required
                          value={formData.grade}
                          onChange={(e) => setFormData({...formData, grade: e.target.value})}
                          className="w-full bg-[#0a0a14] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-purple-500 transition-all appearance-none"
                        >
                          <option value="" className="bg-[#0a0a14] text-white">اختر الصف</option>
                          <optgroup label="المرحلة الثانوية" className="bg-[#0a0a14] text-white">
                            <option value="الصف الأول الثانوي" className="text-white">الأول الثانوي</option>
                            <option value="الصف الثاني الثانوي" className="text-white">الثاني الثانوي</option>
                            <option value="الصف الثالث الثانوي" className="text-white">الثالث الثانوي</option>
                          </optgroup>
                          <optgroup label="المرحلة الإعدادية" className="bg-[#0a0a14] text-white">
                            <option value="الصف الأول الإعدادي" className="text-white">الأول الإعدادي</option>
                            <option value="الصف الثاني الإعدادي" className="text-white">الثاني الإعدادي</option>
                            <option value="الصف الثالث الإعدادي" className="text-white">الثالث الإعدادي</option>
                          </optgroup>
                          <optgroup label="المرحلة الابتدائية" className="bg-[#0a0a14] text-white">
                            <option value="الصف الأول الابتدائي" className="text-white">الأول الابتدائي</option>
                            <option value="الصف الثاني الابتدائي" className="text-white">الثاني الابتدائي</option>
                            <option value="الصف الثالث الابتدائي" className="text-white">الثالث الابتدائي</option>
                            <option value="الصف الرابع الابتدائي" className="text-white">الرابع الابتدائي</option>
                            <option value="الصف الخامس الابتدائي" className="text-white">الخامس الابتدائي</option>
                            <option value="الصف السادس الابتدائي" className="text-white">السادس الابتدائي</option>
                          </optgroup>
                        </select>
                      </div>
                    </>
                  )}

                  {activeTab === 'STUDENTS' && (
                    <div className="col-span-full">
                      <label className="block text-sm font-bold text-slate-400 mb-1">الصف الدراسي</label>
                      <select 
                        required
                        value={formData.grade}
                        onChange={(e) => setFormData({...formData, grade: e.target.value})}
                        className="w-full bg-[#0a0a14] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-purple-500 transition-all appearance-none"
                      >
                        <option value="" className="bg-[#0a0a14] text-white">اختر الصف</option>
                        <optgroup label="المرحلة الابتدائية" className="bg-[#0a0a14] text-white">
                          <option value="الصف الأول الابتدائي" className="text-white">الأول الابتدائي</option>
                          <option value="الصف الثاني الابتدائي" className="text-white">الثاني الابتدائي</option>
                          <option value="الصف الثالث الابتدائي" className="text-white">الثالث الابتدائي</option>
                          <option value="الصف الرابع الابتدائي" className="text-white">الرابع الابتدائي</option>
                          <option value="الصف الخامس الابتدائي" className="text-white">الخامس الابتدائي</option>
                          <option value="الصف السادس الابتدائي" className="text-white">السادس الابتدائي</option>
                        </optgroup>
                        <optgroup label="المرحلة الإعدادية" className="bg-[#0a0a14] text-white">
                          <option value="الصف الأول الإعدادي" className="text-white">الأول الإعدادي</option>
                          <option value="الصف الثاني الإعدادي" className="text-white">الثاني الإعدادي</option>
                          <option value="الصف الثالث الإعدادي" className="text-white">الثالث الإعدادي</option>
                        </optgroup>
                        <optgroup label="المرحلة الثانوية" className="bg-[#0a0a14] text-white">
                          <option value="الصف الأول الثانوي" className="text-white">الأول الثانوي</option>
                          <option value="الصف الثاني الثانوي" className="text-white">الثاني الثانوي</option>
                          <option value="الصف الثالث الثانوي" className="text-white">الثالث الثانوي</option>
                        </optgroup>
                      </select>
                    </div>
                  )}


                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-slate-400 mb-1">رقم الهاتف</label>
                    <input 
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-purple-500 transition-all"
                      placeholder="01xxxxxxxxx"
                    />
                  </div>
                </div>

                <button 
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl mt-4 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
                >
                  {isSubmitting ? "جاري الحفظ..." : "حفظ البيانات"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Content Table */}
        <div className="bg-[#0f0f1d] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-white/[0.02] text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                  {activeTab === 'COURSES' ? (
                    <>
                      <th className="px-6 py-4">اسم الكورس</th>
                      <th className="px-6 py-4">الصف الدراسي</th>
                      <th className="px-6 py-4">المادة</th>
                      <th className="px-6 py-4">عدد الدروس</th>
                      <th className="px-6 py-4 text-center">الإجراءات</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4">المستخدم</th>
                      <th className="px-6 py-4">بيانات الحساب</th>
                      <th className="px-6 py-4">التفاصيل الأكاديمية</th>
                      <th className="px-6 py-4">الحالة</th>
                      <th className="px-6 py-4 text-center">الإجراءات</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {!isLoading && activeTab === 'COURSES' && filteredData.map((course) => (
                  <tr key={course.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-base">{course.title}</p>
                          <p className="text-slate-500 text-[10px]">{course.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-bold text-sm">
                      {course.grade}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {course.subject}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-300 font-bold">
                        <ClipboardList className="w-4 h-4 text-purple-400" />
                        {course._count?.lessons || 0} درس
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link 
                          href={`/courses/${course.id}`}
                          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all"
                        >
                          <Activity className="w-3 h-3" />
                          <span>عرض المحتوى</span>
                        </Link>
                        <Link 
                          href={`/super-admin/courses/edit?id=${course.id}&schoolId=${id}`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all border bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border-blue-500/20"
                        >
                          <Edit2 size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && activeTab !== 'COURSES' && filteredData.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img 
                            src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`} 
                            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/5 group-hover:ring-purple-500/50 transition-all"
                            alt=""
                          />
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0f0f1d] ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                        </div>
                        <div>
                          <p className="font-bold text-white text-base">{user.name}</p>
                          <p className="text-slate-500 text-xs font-mono" dir="ltr">{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-300 text-xs font-bold">
                          <Phone className="w-3 h-3 text-purple-400" />
                          {user.phone || "بدون هاتف"}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                          <Key className="w-3 h-3" />
                          {user.plainPassword || "********"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-black border border-blue-500/20">
                          {user.role === 'TEACHER' ? user.specialization : user.grade || "غير محدد"}
                        </span>
                        <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                          <Activity className="w-3 h-3" />
                          {user.role === 'TEACHER' ? user.grade : user.classroom?.name || "بدون فصل"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${user.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {user.status === 'ACTIVE' ? 'نشط' : 'متوقف'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleImpersonate(user)}
                          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-lg shadow-indigo-900/20 active:scale-95 group/btn"
                          title="Login as User"
                        >
                          <Sparkles className="w-3 h-3 group-hover/btn:animate-pulse" />
                          <span>دخول مباشر</span>
                        </button>
                        
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleEditOpen(user)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all border bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border-blue-500/20"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(user.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all border bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border-red-500/20"
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
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
                <Search className="w-10 h-10 text-slate-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-500">لا توجد بيانات مطابقة للبحث</h3>
              <p className="text-slate-600 text-sm mt-1">تأكد من كتابة الاسم بشكل صحيح أو تغيير الفلاتر</p>
            </div>
          )}
        </div>
      </main>
    </div>
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
    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4 group hover:bg-white/[0.07] transition-all">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]} flex items-center justify-center text-white shadow-lg shadow-black/20`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</p>
        <h4 className="text-xl font-black text-white leading-none mt-1">{value}</h4>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${active ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
    >
      {icon}
      {label}
    </button>
  );
}

function ActionBtn({ icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border-blue-500/20",
    red: "bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border-red-500/20",
    slate: "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border-white/5",
  };
  return (
    <button className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border ${colors[color]}`}>
      {icon}
    </button>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-6"><div className="h-10 bg-white/5 rounded-xl w-32"></div></td>
      <td className="px-6 py-6"><div className="h-8 bg-white/5 rounded-xl w-24"></div></td>
      <td className="px-6 py-6"><div className="h-8 bg-white/5 rounded-xl w-20"></div></td>
      <td className="px-6 py-6"><div className="h-8 bg-white/5 rounded-xl w-16"></div></td>
      <td className="px-6 py-4"><div className="h-10 bg-white/5 rounded-xl w-full"></div></td>
    </tr>
  );
}

function LayoutDashboard({ size }: any) {
  return <Building2 size={size} />;
}
