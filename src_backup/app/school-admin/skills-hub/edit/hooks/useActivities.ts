import { useState } from 'react';
import { API_URL } from '@/lib/api';

export const useActivities = (props: { clusterId: string | null; language: string; showToast: any; fetchLessons: any }) => {
  const { clusterId, language, showToast, fetchLessons } = props;

  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [activitiesData, setActivitiesData] = useState<Record<string, any[]>>({});
  
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);

  const fetchActivities = async (lessonId: string) => {
    try {
      const token = localStorage.getItem('school_admin_token');
      const res = await fetch(`${API_URL}/skills-hub/lessons/${lessonId}/activities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActivitiesData(prev => ({
          ...prev,
          [lessonId]: data || []
        }));
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  };

  const toggleLessonExpand = (lessonId: string) => {
    if (expandedLessonId === lessonId) {
      setExpandedLessonId(null);
    } else {
      setExpandedLessonId(lessonId);
      if (!activitiesData[lessonId]) {
        fetchActivities(lessonId);
      }
    }
  };

  const openAddActivity = (lessonId: string) => {
    setEditingActivity({ lessonId, isNew: true });
    setIsActivityModalOpen(true);
  };

  const openEditActivity = (activity: any) => {
    setEditingActivity(activity);
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = async (activityData: any) => {
    if (!activityData.title || !activityData.type || !activityData.skill) {
      showToast(language === 'ar' ? 'يرجى إكمال البيانات الأساسية للنشاط' : 'Please complete basic activity info', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('school_admin_token');
      const isNew = editingActivity?.isNew;
      const url = isNew 
        ? `${API_URL}/skills-hub/lessons/${editingActivity.lessonId}/activities`
        : `${API_URL}/skills-hub/activities/${editingActivity.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(activityData)
      });

      if (res.ok) {
        showToast(language === 'ar' ? 'تم حفظ النشاط بنجاح' : 'Activity saved successfully', 'success');
        setIsActivityModalOpen(false);
        const lid = isNew ? editingActivity.lessonId : editingActivity.lessonId;
        fetchActivities(lid);
        // We should also update lesson count theoretically
        fetchLessons();
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || (language === 'ar' ? 'حدث خطأ' : 'Error occurred'), 'error');
      }
    } catch (err) {
      console.error('Error saving activity:', err);
      showToast(language === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Connection error', 'error');
    }
  };

  const handleDeleteActivity = async (id: string, lessonId: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا النشاط؟' : 'Are you sure you want to delete this activity?')) return;
    
    try {
      const token = localStorage.getItem('school_admin_token');
      const res = await fetch(`${API_URL}/skills-hub/activities/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast(language === 'ar' ? 'تم حذف النشاط' : 'Activity deleted', 'success');
        fetchActivities(lessonId);
        fetchLessons();
      }
    } catch (err) {
      console.error('Error deleting activity:', err);
    }
  };

  return {
    expandedLessonId, setExpandedLessonId,
    activitiesData, setActivitiesData,
    fetchActivities, toggleLessonExpand,
    isActivityModalOpen, setIsActivityModalOpen,
    editingActivity, setEditingActivity,
    openAddActivity, openEditActivity, handleSaveActivity, handleDeleteActivity
  };
};
