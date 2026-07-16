"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useNotification } from "@/context/NotificationContext";

export function useLessonBlocks(currentLesson: any, setCurrentLesson: (lesson: any) => void) {
  const { language } = useLanguage();
  const { showToast } = useNotification();

  const addBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', type: 'TEXT' | 'QUESTION') => {
    const newBlock = type === 'TEXT' 
      ? { id: Date.now() + Math.random(), type: 'TEXT', label: 'CONTENT', title: language === 'ar' ? `محتوى جديد` : `New Content`, content: "", text: "", videoUrl: "", sections: [] }
      : { id: Date.now() + Math.random(), type: 'QUESTION', label: 'MCQ', title: language === 'ar' ? `سؤال جديد` : `New Question`, content: "", text: "", videoUrl: "", options: ["", "", "", ""], correctAnswer: "", sections: [] };
    const currentList = currentLesson[source] || [];
    setCurrentLesson({
      ...currentLesson,
      [source]: [...currentList, newBlock]
    });
  };

  const insertBlockAt = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, type: 'TEXT' | 'QUESTION') => {
    const newBlock = type === 'TEXT' 
      ? { id: Date.now() + Math.random(), type: 'TEXT', label: 'CONTENT', title: language === 'ar' ? `محتوى جديد` : `New Content`, content: "", text: "", videoUrl: "", sections: [] }
      : { id: Date.now() + Math.random(), type: 'QUESTION', label: 'MCQ', title: language === 'ar' ? `سؤال جديد` : `New Question`, content: "", text: "", videoUrl: "", options: ["", "", "", ""], correctAnswer: "", sections: [] };
    const newSlides = [...(currentLesson[source] || [])];
    newSlides.splice(index, 0, newBlock);
    setCurrentLesson({
      ...currentLesson,
      [source]: newSlides
    });
    showToast(language === 'ar' ? "تم إدراج الشريحة بنجاح" : "Slide inserted successfully", "success");
  };

  const moveBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, direction: 'UP' | 'DOWN') => {
    const newSlides = [...(currentLesson[source] || [])];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSlides.length) return;
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;
    setCurrentLesson({
      ...currentLesson,
      [source]: newSlides
    });
  };

  const updateBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, field: string, value: any) => {
    setCurrentLesson((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      newSlides[index] = { ...newSlides[index], [field]: value };
      if (field === 'content') {
        newSlides[index].text = value;
      } else if (field === 'text') {
        newSlides[index].content = value;
      }
      return { ...prev, [source]: newSlides };
    });
  };

  const updateBlockTypeAndReset = (source: 'slides' | 'assignments' | 'questions', index: number, newType: string) => {
    const isOldSimple = ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(newType);
    let defaultOptions: any = ["", "", "", ""];
    let defaultCorrect = "";
    
    if (newType === 'TRUE_FALSE') {
      defaultOptions = ["True", "False"];
      defaultCorrect = "True";
    } else if (newType === 'MULTI_SELECT') {
      defaultOptions = ["", "", "", ""];
      defaultCorrect = "[]";
    } else if (!isOldSimple) {
      if (newType === 'MATCHING') {
        defaultOptions = JSON.stringify({ left: [], right: [] });
        defaultCorrect = JSON.stringify({});
      } else if (newType === 'DRAG_DROP_FILL') {
        defaultOptions = JSON.stringify({ sentence: "", choices: [] });
        defaultCorrect = JSON.stringify([]);
      } else if (newType === 'GROUP_SORTING') {
        defaultOptions = JSON.stringify({ groups: [], items: [] });
        defaultCorrect = JSON.stringify({});
      } else if (newType === 'CLOCK') {
        defaultOptions = JSON.stringify({ minuteStep: 5 });
        defaultCorrect = "12:00";
      } else if (newType === 'MIND_MAP') {
        defaultOptions = JSON.stringify({ nodes: [] });
        defaultCorrect = JSON.stringify({});
      } else if (newType === 'VIDEO_CHECKPOINT') {
        defaultOptions = JSON.stringify({ videoUrl: "", checkpoints: [] });
        defaultCorrect = JSON.stringify({});
      } else if (newType === 'GEOGEBRA') {
        defaultOptions = JSON.stringify({ materialId: "", width: 800, height: 500, iframeUrl: "" });
        defaultCorrect = "";
      } else {
        defaultOptions = JSON.stringify({ choices: [] });
        defaultCorrect = "";
      }
    }
    
    setCurrentLesson((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      newSlides[index] = { 
        ...newSlides[index], 
        label: newType,
        options: defaultOptions,
        correctAnswer: defaultCorrect,
        correctAnswers: newType === 'MULTI_SELECT' ? [] : undefined
      };
      return { ...prev, [source]: newSlides };
    });
  };

  const removeBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذه الشريحة/السؤال؟" : "Are you sure you want to delete this slide/question?")) return;
    const newSlides = [...(currentLesson[source] || [])];
    newSlides.splice(index, 1);
    setCurrentLesson({ ...currentLesson, [source]: newSlides });
  };

  const addSection = (source: 'slides' | 'assignments' | 'questions' = 'slides', blockIndex: number, type: string) => {
    const newSlides = [...(currentLesson[source] || [])];
    if (!newSlides[blockIndex].sections) newSlides[blockIndex].sections = [];
    newSlides[blockIndex].sections.push({ id: Date.now() + Math.random(), type, content: "" });
    setCurrentLesson({ ...currentLesson, [source]: newSlides });
  };

  const updateSection = (source: 'slides' | 'assignments' | 'questions' = 'slides', blockIndex: number, sectionIndex: number, content: string) => {
    const newSlides = [...(currentLesson[source] || [])];
    newSlides[blockIndex].sections[sectionIndex].content = content;
    setCurrentLesson({ ...currentLesson, [source]: newSlides });
  };

  const removeSection = (source: 'slides' | 'assignments' | 'questions' = 'slides', blockIndex: number, sectionIndex: number) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا القسم؟" : "Are you sure you want to delete this section?")) return;
    const newSlides = [...(currentLesson[source] || [])];
    newSlides[blockIndex].sections.splice(sectionIndex, 1);
    setCurrentLesson({ ...currentLesson, [source]: newSlides });
  };


  return {
    addBlock,
    insertBlockAt,
    moveBlock,
    updateBlock,
    updateBlockTypeAndReset,
    removeBlock,
    addSection,
    updateSection,
    removeSection
  };
}
