"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";
import { CheckCircle2, XCircle, Search, Filter, Loader2, Download, Building2, GraduationCap, ClipboardList } from "lucide-react";

export default function ExamAttendanceReport({ role }: { role: "SUPER_ADMIN" | "SCHOOL_ADMIN" }) {
  const [schools, setSchools] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState<string>("");
  
  const [reportData, setReportData] = useState<{attended: any[], missed: any[], total: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const grades = [
    { value: "الصف الأول الابتدائي", label: "الصف الأول الابتدائي" },
    { value: "الصف الثاني الابتدائي", label: "الصف الثاني الابتدائي" },
    { value: "الصف الثالث الابتدائي", label: "الصف الثالث الابتدائي" },
    { value: "الصف الرابع الابتدائي", label: "الصف الرابع الابتدائي" },
    { value: "الصف الخامس الابتدائي", label: "الصف الخامس الابتدائي" },
    { value: "الصف السادس الابتدائي", label: "الصف السادس الابتدائي" },
    { value: "الصف الأول الإعدادي", label: "الصف الأول الإعدادي" },
    { value: "الصف الثاني الإعدادي", label: "الصف الثاني الإعدادي" },
    { value: "الصف الثالث الإعدادي", label: "الصف الثالث الإعدادي" },
    { value: "الصف الأول الثانوي", label: "الصف الأول الثانوي" },
    { value: "الصف الثاني الثانوي", label: "الصف الثاني الثانوي" },
    { value: "الصف الثالث الثانوي", label: "الصف الثالث الثانوي" },
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
      setError("الرجاء اختيار المدرسة والصف والامتحان");
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
      if (!res.ok) throw new Error(data.error || "فشل في جلب التقرير");
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
          تحديد التقرير
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {role === "SUPER_ADMIN" && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" /> المدرسة
              </label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
              >
                <option value="">-- اختر المدرسة --</option>
                {Array.isArray(schools) && schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-slate-400" /> الصف الدراسي
            </label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              disabled={role === "SUPER_ADMIN" && !selectedSchool}
            >
              <option value="">-- اختر الصف --</option>
              {grades.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-slate-400" /> الامتحان
            </label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              disabled={!selectedGrade || exams.length === 0}
            >
              <option value="">-- اختر الامتحان --</option>
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
            عرض التقرير
          </button>
        </div>
      </div>

      {reportData && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-slate-800">نتائج التقرير</h2>
            <div className="flex gap-4">
              <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-bold text-sm">
                امتحنوا: {reportData.attended.length}
              </div>
              <div className="px-4 py-2 bg-red-50 text-red-700 rounded-lg font-bold text-sm">
                لم يمتحنوا: {reportData.missed.length}
              </div>
              <div className="px-4 py-2 bg-slate-50 text-slate-700 rounded-lg font-bold text-sm">
                الإجمالي: {reportData.total}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Attended List */}
            <div>
              <h3 className="text-lg font-bold text-green-600 flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5" />
                الطلاب الذين أدوا الامتحان
              </h3>
              <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                {reportData.attended.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-bold">لا يوجد طلاب أدوا الامتحان</div>
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
                          <p className="text-xs text-slate-400">الدرجة: {student.score}</p>
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
                الطلاب الذين لم يؤدوا الامتحان
              </h3>
              <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                {reportData.missed.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-bold">جميع الطلاب أدوا الامتحان</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {Array.isArray(reportData.missed) && reportData.missed.map(student => (
                      <div key={student.id} className="p-4 flex justify-between items-center bg-white">
                        <div>
                          <p className="font-bold text-slate-800">{student.name}</p>
                          <p className="text-xs text-slate-500">{student.username}</p>
                        </div>
                        <div className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">
                          غائب
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
