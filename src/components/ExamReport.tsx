"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";
import { CheckCircle2, XCircle, Search, Filter, Loader2, Download, Building2, GraduationCap, ClipboardList } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ExamAttendanceReport({ role }: { role: "SUPER_ADMIN" | "SCHOOL_ADMIN" }) {
  const { language } = useLanguage();
  const [schools, setSchools] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState<string>("");
  
  const [reportData, setReportData] = useState<{attended: any[], missed: any[], total: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const grades = [
    { value: "الصف الأول الابتدائي", label: language === 'ar' ? "الصف الأول الابتدائي" : "1st Primary" },
    { value: "الصف الثاني الابتدائي", label: language === 'ar' ? "الصف الثاني الابتدائي" : "2nd Primary" },
    { value: "الصف الثالث الابتدائي", label: language === 'ar' ? "الصف الثالث الابتدائي" : "3rd Primary" },
    { value: "الصف الرابع الابتدائي", label: language === 'ar' ? "الصف الرابع الابتدائي" : "4th Primary" },
    { value: "الصف الخامس الابتدائي", label: language === 'ar' ? "الصف الخامس الابتدائي" : "5th Primary" },
    { value: "الصف السادس الابتدائي", label: language === 'ar' ? "الصف السادس الابتدائي" : "6th Primary" },
    { value: "الصف الأول الإعدادي", label: language === 'ar' ? "الصف الأول الإعدادي" : "1st Prep" },
    { value: "الصف الثاني الإعدادي", label: language === 'ar' ? "الصف الثاني الإعدادي" : "2nd Prep" },
    { value: "الصف الثالث الإعدادي", label: language === 'ar' ? "الصف الثالث الإعدادي" : "3rd Prep" },
    { value: "الصف الأول الثانوي", label: language === 'ar' ? "الصف الأول الثانوي" : "1st Secondary" },
    { value: "الصف الثاني الثانوي", label: language === 'ar' ? "الصف الثاني الثانوي" : "2nd Secondary" },
    { value: "الصف الثالث الثانوي", label: language === 'ar' ? "الصف الثالث الثانوي" : "3rd Secondary" },
  ];

  const getToken = () => {
    return role === "SUPER_ADMIN" 
      ? localStorage.getItem("super_admin_token") 
      : localStorage.getItem("school_admin_token");
  };

  useEffect(() => {
    if (role === "SUPER_ADMIN") {
      fetchSchools();
    } else {
      // For School Admin, get their school ID from user token
      const userStr = localStorage.getItem("school_admin_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.schoolId) {
          setSelectedSchool(user.schoolId);
        }
      }
    }
  }, [role]);

  useEffect(() => {
    if (selectedSchool && selectedGrade) {
      fetchExams();
    } else {
      setExams([]);
      setSelectedExam("");
      setReportData(null);
    }
  }, [selectedSchool, selectedGrade]);

  const fetchSchools = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/admin/schools`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Handle both direct array and paginated object response
        const schoolsData = Array.isArray(data) ? data : (data.schools || []);
        setSchools(schoolsData);
      }
    } catch (e) {
      console.error("Error fetching schools", e);
    }
  };

  const fetchExams = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/exams?schoolId=${selectedSchool}&grade=${selectedGrade}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExams(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Error fetching exams", e);
    }
  };

  const generateReport = async () => {
    if (!selectedSchool || !selectedGrade || !selectedExam) {
      setError(language === 'ar' ? "الرجاء اختيار المدرسة والصف والامتحان" : "Please select school, grade, and exam");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/reports/exam-attendance?schoolId=${selectedSchool}&grade=${selectedGrade}&examId=${selectedExam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (language === 'ar' ? "فشل في جلب التقرير" : "Failed to fetch report"));
      setReportData(data);
    } catch (err: any) {
      setError(err.message);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const getGradeLabel = (gradeValue: string) => {
    return grades.find(g => g.value === gradeValue)?.label || gradeValue;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
          <Filter className="w-6 h-6 text-indigo-600" />
          {language === 'ar' ? "تحديد التقرير" : "Report Selection"}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {role === "SUPER_ADMIN" && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" /> {language === 'ar' ? "المدرسة" : "School"}
              </label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
              >
                <option value="">-- {language === 'ar' ? "اختر المدرسة" : "Select School"} --</option>
                {Array.isArray(schools) && schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-slate-400" /> {language === 'ar' ? "الصف الدراسي" : "Grade Level"}
            </label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              disabled={role === "SUPER_ADMIN" && !selectedSchool}
            >
              <option value="">-- {language === 'ar' ? "اختر الصف" : "Select Grade"} --</option>
              {grades.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-slate-400" /> {language === 'ar' ? "الامتحان" : "Exam"}
            </label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              disabled={!selectedGrade || exams.length === 0}
            >
              <option value="">-- {language === 'ar' ? "اختر الامتحان" : "Select Exam"} --</option>
              {Array.isArray(exams) && exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl font-bold text-sm text-center">
            {error}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button 
            onClick={generateReport}
            disabled={loading || !selectedExam}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {language === 'ar' ? "عرض التقرير" : "Show Report"}
          </button>
        </div>
      </div>

      {reportData && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-slate-800">{language === 'ar' ? "نتائج التقرير" : "Report Results"}</h2>
            <div className="flex gap-4">
              <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-bold text-sm">
                {language === 'ar' ? "امتحنوا" : "Attended"}: {reportData.attended.length}
              </div>
              <div className="px-4 py-2 bg-red-50 text-red-700 rounded-lg font-bold text-sm">
                {language === 'ar' ? "لم يمتحنوا" : "Missed"}: {reportData.missed.length}
              </div>
              <div className="px-4 py-2 bg-slate-50 text-slate-700 rounded-lg font-bold text-sm">
                {language === 'ar' ? "الإجمالي" : "Total"}: {reportData.total}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Attended List */}
            <div>
              <h3 className="text-lg font-bold text-green-600 flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5" />
                {language === 'ar' ? "الطلاب الذين أدوا الامتحان" : "Students who took the exam"}
              </h3>
              <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                {reportData.attended.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-bold">
                    {language === 'ar' ? "لا يوجد طلاب أدوا الامتحان" : "No students took the exam"}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {Array.isArray(reportData.attended) && reportData.attended.map(student => (
                      <div key={student.id} className="p-4 flex justify-between items-center bg-white">
                        <div>
                          <p className="font-bold text-slate-800">{student.name}</p>
                          <p className="text-xs text-slate-500">{student.username}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-black text-green-600 text-lg">{student.percentage}%</p>
                          <p className="text-xs text-slate-400">{language === 'ar' ? "الدرجة" : "Score"}: {student.score}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Missed List */}
            <div>
              <h3 className="text-lg font-bold text-red-600 flex items-center gap-2 mb-4">
                <XCircle className="w-5 h-5" />
                {language === 'ar' ? "الطلاب الذين لم يؤدوا الامتحان" : "Students who did not take the exam"}
              </h3>
              <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                {reportData.missed.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-bold">
                    {language === 'ar' ? "جميع الطلاب أدوا الامتحان" : "All students took the exam"}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {Array.isArray(reportData.missed) && reportData.missed.map(student => (
                      <div key={student.id} className="p-4 flex justify-between items-center bg-white">
                        <div>
                          <p className="font-bold text-slate-800">{student.name}</p>
                          <p className="text-xs text-slate-500">{student.username}</p>
                        </div>
                        <div className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">
                          {language === 'ar' ? "غائب" : "Absent"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
