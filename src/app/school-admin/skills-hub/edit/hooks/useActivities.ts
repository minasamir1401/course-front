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
    setEditingActivity({
      lessonId,
      isNew: true,
      title: '',
      titleEn: '',
      type: 'MCQ',
      points: 10,
      xpPoints: 10,
      difficulty: 'On Level',
      dok: '',
      skill: '',
      questionText: '',
      questionTextEn: '',
      options: { choices: ["", "", "", ""] },
      optionsEn: null,
      correctAnswer: "",
      correctAnswerEn: null,
      explanation: '',
      explanationEn: '',
      hint: '',
      hintEn: '',
      tip: '',
      tipEn: '',
      keyInsight: '',
      keyInsightEn: ''
    });
    setIsActivityModalOpen(true);
  };

  const openEditActivity = (activity: any) => {
    setEditingActivity({
      ...activity,
      title: activity.title || '',
      titleEn: activity.titleEn || '',
      questionText: activity.questionText || '',
      questionTextEn: activity.questionTextEn || '',
      explanation: activity.explanation || '',
      explanationEn: activity.explanationEn || '',
      hint: activity.hint || '',
      hintEn: activity.hintEn || '',
      tip: activity.tip || '',
      tipEn: activity.tipEn || '',
      keyInsight: activity.keyInsight || '',
      keyInsightEn: activity.keyInsightEn || ''
    });
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = async (data: any) => {
    const hasAr = (str?: any) => /[\u0600-\u06FF]/.test(String(str || ''));
    const hasEn = (str?: any) => /[a-zA-Z]/.test(String(str || ''));

    const effectiveTitle = data?.title || data?.titleEn || '';
    const effectiveTitleEn = data?.titleEn || (hasEn(data?.title) && !hasAr(data?.title) ? data.title : null);

    if (!effectiveTitle || !data?.type) {
      showToast(language === 'ar' ? 'يرجى إدخال عنوان ونوع النشاط' : 'Please enter activity title and type', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('school_admin_token');
      const isNew = Boolean(editingActivity?.isNew || !data.id);
      const url = isNew 
        ? `${API_URL}/skills-hub/activities`
        : `${API_URL}/skills-hub/activities/${data.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = {
        lessonId: editingActivity?.lessonId || data.lessonId,
        title: effectiveTitle,
        titleEn: effectiveTitleEn,
        questionText: data.questionText || data.questionTextEn || null,
        questionTextEn: data.questionTextEn || (hasEn(data.questionText) && !hasAr(data.questionText) ? data.questionText : null),
        type: data.type,
        options: typeof data.options === 'string' ? data.options : JSON.stringify(data.options || {}),
        optionsEn: data.optionsEn !== undefined ? (typeof data.optionsEn === 'string' ? data.optionsEn : JSON.stringify(data.optionsEn)) : null,
        correctAnswer: typeof data.correctAnswer === 'string' ? data.correctAnswer : JSON.stringify(data.correctAnswer || ''),
        correctAnswerEn: data.correctAnswerEn !== undefined ? (typeof data.correctAnswerEn === 'string' ? data.correctAnswerEn : JSON.stringify(data.correctAnswerEn)) : null,
        points: Number(data.points) || 10,
        xpPoints: Number(data.xpPoints) || 10,
        difficulty: data.difficulty || 'Medium',
        dok: data.dok || null,
        estimatedTime: Number(data.estimatedTime) || 60,
        standard: data.standard || null,
        indicator: data.indicator || null,
        learningOutcome: data.learningOutcome || null,
        skill: data.skill || null,
        hint: data.hint || null,
        hintEn: data.hintEn || null,
        tip: data.tip || null,
        tipEn: data.tipEn || null,
        explanation: data.explanation || null,
        explanationEn: data.explanationEn || null,
        keyInsight: data.keyInsight || null,
        keyInsightEn: data.keyInsightEn || null
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(language === 'ar' ? 'تم حفظ النشاط بنجاح' : 'Activity saved successfully', 'success');
        setIsActivityModalOpen(false);
        const lid = editingActivity?.lessonId || data.lessonId;
        if (lid) fetchActivities(lid);
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
