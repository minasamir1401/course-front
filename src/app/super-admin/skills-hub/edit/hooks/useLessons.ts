import { useState } from 'react';
import { API_URL } from '@/lib/api';

const getSuperToken = () => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('super_admin_token') || localStorage.getItem('super_token') || '';
};

export const useLessons = (props: { clusterId: string | null; language: string; showToast: any }) => {
  const { clusterId, language, showToast } = props;

  const [lessons, setLessons] = useState<any[]>([]);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);

  const fetchLessons = async () => {
    if (!clusterId) return;
    try {
      const token = getSuperToken();
      const res = await fetch(`${API_URL}/skills-hub/clusters/${clusterId}/lessons`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLessons(data || []);
      }
    } catch (err) {
      console.error('Error fetching lessons:', err);
    }
  };

  const openAddLesson = () => {
    setEditingLesson({ name: '', description: '', order: lessons.length + 1 });
    setIsLessonModalOpen(true);
  };

  const openEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async (lessonData?: any) => {
    const data = (lessonData && typeof lessonData === 'object' && !('nativeEvent' in lessonData))
      ? lessonData
      : editingLesson;

    const lessonName = (data?.name || data?.title || '').trim();
    if (!lessonName) {
      showToast(language === 'ar' ? 'يرجى إدخال اسم الدرس' : 'Please enter lesson name', 'error');
      return;
    }

    try {
      const token = getSuperToken();
      const isEdit = Boolean(editingLesson && editingLesson.id);
      const url = isEdit 
        ? `${API_URL}/skills-hub/lessons/${editingLesson.id}` 
        : `${API_URL}/skills-hub/lessons`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          clusterId,
          name: lessonName,
          title: lessonName,
          description: data?.description || '',
          order: Number(data?.order) || 0
        })
      });

      if (res.ok) {
        showToast(language === 'ar' ? 'تم حفظ الدرس بنجاح' : 'Lesson saved', 'success');
        setIsLessonModalOpen(false);
        setEditingLesson(null);
        fetchLessons();
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || (language === 'ar' ? 'خطأ في حفظ الدرس' : 'Error saving lesson'), 'error');
      }
    } catch (err) {
      console.error('Error saving lesson:', err);
      showToast(language === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Connection error', 'error');
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الدرس؟' : 'Are you sure you want to delete this lesson?')) return;
    
    try {
      const token = getSuperToken();
      const res = await fetch(`${API_URL}/skills-hub/lessons/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast(language === 'ar' ? 'تم حذف الدرس' : 'Lesson deleted', 'success');
        fetchLessons();
      }
    } catch (err) {
      console.error('Error deleting lesson:', err);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetLessonId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLessonId(targetLessonId);
    try {
      const token = getSuperToken();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/skills-hub/lessons/${targetLessonId}/upload-excel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        showToast(language === 'ar' ? 'تم رفع الأنشطة بنجاح' : 'Activities uploaded successfully', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || (language === 'ar' ? 'فشل رفع الملف' : 'Upload failed'), 'error');
      }
    } catch (err) {
      console.error('Error uploading excel:', err);
      showToast(language === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Connection error', 'error');
    } finally {
      setUploadingLessonId(null);
      if (e.target) e.target.value = '';
    }
  };

  return {
    lessons, setLessons, fetchLessons, 
    isLessonModalOpen, setIsLessonModalOpen, 
    editingLesson, setEditingLesson,
    openAddLesson, openEditLesson, handleSaveLesson, handleDeleteLesson,
    uploadingLessonId, handleExcelUpload
  };
};
