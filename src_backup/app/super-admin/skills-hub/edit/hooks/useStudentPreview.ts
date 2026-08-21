import { useState, useEffect } from 'react';
import { isAnswerCorrect } from '@/lib/answerEvaluation';

export const useStudentPreview = (props: { language: string }) => {
  const { language } = props;

  const [previewActivity, setPreviewActivity] = useState<any>(null);
  const [previewAnswer, setPreviewAnswer] = useState<string>("");
  const [previewIsSubmitting, setPreviewIsSubmitting] = useState(false);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [previewToast, setPreviewToast] = useState<any>(null);
  const [previewStartTime, setPreviewStartTime] = useState<number>(0);
  const [previewHintsUsed, setPreviewHintsUsed] = useState<number>(0);
  const [previewAttemptCount, setPreviewAttemptCount] = useState<number>(1);
  const [previewHelperModal, setPreviewHelperModal] = useState<{ type: "hint" | "tip" | "keyInsight" | null; content: string }>({
    type: null,
    content: ""
  });
  const [previewActivitiesList, setPreviewActivitiesList] = useState<any[]>([]);
  const [previewTimeLeft, setPreviewTimeLeft] = useState<number | null>(null);
  const [previewIsLoading, setPreviewIsLoading] = useState<boolean>(false);

  // Auto-hide toast
  useEffect(() => {
    if (previewToast) {
      const timer = setTimeout(() => setPreviewToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [previewToast]);

  // Timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (previewActivity && !previewResult && previewTimeLeft !== null && previewTimeLeft > 0) {
      timer = setInterval(() => {
        setPreviewTimeLeft(prev => {
          if (prev && prev <= 1) {
            clearInterval(timer);
            // Handle timeout automatically?
            return 0;
          }
          return prev ? prev - 1 : 0;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [previewActivity, previewResult, previewTimeLeft]);

  const openPreview = (activity: any, activitiesList: any[]) => {
    setPreviewActivitiesList(activitiesList);
    setPreviewActivity(activity);
    setPreviewAnswer("");
    setPreviewResult(null);
    setPreviewStartTime(Date.now());
    setPreviewHintsUsed(0);
    setPreviewAttemptCount(1);
    setPreviewHelperModal({ type: null, content: "" });
    
    // Set timer based on difficulty
    const diff = activity.difficulty?.toLowerCase() || 'medium';
    setPreviewTimeLeft(diff === 'hard' ? 300 : diff === 'medium' ? 180 : 120);
  };

  const closePreview = () => {
    setPreviewActivity(null);
    setPreviewResult(null);
    setPreviewActivitiesList([]);
  };

  const handlePreviewNext = () => {
    if (!previewActivity || previewActivitiesList.length === 0) return;
    const currentIndex = previewActivitiesList.findIndex(a => a.id === previewActivity.id);
    if (currentIndex >= 0 && currentIndex < previewActivitiesList.length - 1) {
      openPreview(previewActivitiesList[currentIndex + 1], previewActivitiesList);
    }
  };

  const handlePreviewPrev = () => {
    if (!previewActivity || previewActivitiesList.length === 0) return;
    const currentIndex = previewActivitiesList.findIndex(a => a.id === previewActivity.id);
    if (currentIndex > 0) {
      openPreview(previewActivitiesList[currentIndex - 1], previewActivitiesList);
    }
  };

  const handlePreviewSubmit = async () => {
    if (!previewAnswer && previewActivity.type !== 'interactive') {
      setPreviewToast({
        type: 'warning',
        message: language === 'ar' ? "الرجاء إدخال إجابة أولاً" : "Please enter an answer first"
      });
      return;
    }

    setPreviewIsSubmitting(true);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const timeTaken = Math.floor((Date.now() - previewStartTime) / 1000);
      const isCorrect = isAnswerCorrect(previewAnswer, previewActivity.data.correctAnswer);
      
      setPreviewResult({
        isCorrect,
        score: isCorrect ? 100 : 0,
        timeTaken,
        hintsUsed: previewHintsUsed,
        attemptCount: previewAttemptCount,
        correctAnswer: previewActivity.data.correctAnswer,
        explanation: previewActivity.data.explanation
      });
      
    } catch (err) {
      setPreviewToast({
        type: 'error',
        message: language === 'ar' ? "حدث خطأ أثناء التقييم" : "Error during evaluation"
      });
    } finally {
      setPreviewIsSubmitting(false);
    }
  };

  const handlePreviewRetry = () => {
    setPreviewAnswer("");
    setPreviewResult(null);
    setPreviewAttemptCount(prev => prev + 1);
    setPreviewStartTime(Date.now());
  };

  return {
    previewActivity, setPreviewActivity,
    previewAnswer, setPreviewAnswer,
    previewIsSubmitting, setPreviewIsSubmitting,
    previewResult, setPreviewResult,
    previewToast, setPreviewToast,
    previewStartTime, setPreviewStartTime,
    previewHintsUsed, setPreviewHintsUsed,
    previewAttemptCount, setPreviewAttemptCount,
    previewHelperModal, setPreviewHelperModal,
    previewActivitiesList, setPreviewActivitiesList,
    previewTimeLeft, setPreviewTimeLeft,
    previewIsLoading, setPreviewIsLoading,
    openPreview, closePreview, handlePreviewNext, handlePreviewPrev, handlePreviewSubmit, handlePreviewRetry
  };
};
