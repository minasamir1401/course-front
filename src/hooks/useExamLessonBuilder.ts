// @ts-nocheck
import { syncRichTextFormatting } from '@/lib/bilingualRichText';
import { getAutoTranslateEnabled } from '@/lib/autoTranslatePreference';
import { hasArabicLetters } from '@/lib/slideLanguage';

export const useExamLessonBuilder = (props: any) => {
  const { setCurrentModule, showToast, language } = props;

  const findBlockIndex = (list: any[], index: number, blockRef?: any) => {
    if (!blockRef) return index;
    const byRef = list.findIndex((candidate: any) => candidate === blockRef || (blockRef.id != null && candidate?.id === blockRef.id));
    return byRef >= 0 ? byRef : index;
  };

  const updateBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, field: string, value: any, blockRef?: any) => {
    setCurrentModule((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      const resolvedIndex = findBlockIndex(newSlides, index, blockRef);
      if (resolvedIndex < 0 || !newSlides[resolvedIndex]) return prev;
      const target = { ...newSlides[resolvedIndex], [field]: value };
      if (field === 'content') target.text = value;
      else if (field === 'text') target.content = value;
      else if (field === 'contentEn') target.textEn = value;
      else if (field === 'textEn') target.contentEn = value;
      newSlides[resolvedIndex] = target;
      return { ...prev, [source]: newSlides };
    });
  };

  const updateBlockFields = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, updates: Record<string, any>, blockRef?: any) => {
    setCurrentModule((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      const resolvedIndex = findBlockIndex(newSlides, index, blockRef);
      if (resolvedIndex < 0 || !newSlides[resolvedIndex]) return prev;
      const target = { ...newSlides[resolvedIndex] };
      let changed = false;
      for (const [field, value] of Object.entries(updates)) {
        if (target[field] !== value) {
          target[field] = value;
          changed = true;
          if (field === 'content') target.text = value;
          else if (field === 'text') target.content = value;
          else if (field === 'contentEn') target.textEn = value;
          else if (field === 'textEn') target.contentEn = value;
        }
      }
      if (!changed) return prev;
      newSlides[resolvedIndex] = target;
      return { ...prev, [source]: newSlides };
    });
  };

  const updateBlockTypeAndReset = (source: 'slides' | 'assignments' | 'questions', index: number, newType: string) => {
    const isOldSimple = ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(newType);
    let defaultOptions: any = ["", "", "", ""];
    let defaultOptionsEn: any = ["", "", "", ""];
    let defaultCorrect = "";
    let defaultCorrectEn = "";

    if (newType === 'TRUE_FALSE') {
      defaultOptions = language === 'en' ? ["True", "False"] : ["صحيح", "خطأ"];
      defaultCorrect = language === 'en' ? "True" : "صحيح";
      defaultOptionsEn = ["True", "False"];
      defaultCorrectEn = "True";
    } else if (newType === 'MULTI_SELECT') {
      defaultOptions = ["", "", "", ""];
      defaultCorrect = "[]";
      defaultCorrectEn = "[]";
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
      defaultOptionsEn = defaultOptions;
      defaultCorrectEn = defaultCorrect;
    }

    setCurrentModule((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      newSlides[index] = {
        ...newSlides[index],
        label: newType,
        options: defaultOptions,
        optionsEn: defaultOptionsEn,
        correctAnswer: defaultCorrect,
        correctAnswerEn: defaultCorrectEn,
        correctAnswers: newType === 'MULTI_SELECT' ? [] : undefined
      };
      return { ...prev, [source]: newSlides };
    });
  };

  const removeBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذه الشريحة/السؤال؟" : "Are you sure you want to delete this slide/question?")) return;
    setCurrentModule((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      newSlides.splice(index, 1);
      return { ...prev, [source]: newSlides };
    });
  };

  const addSection = (source: 'slides' | 'assignments' | 'questions' = 'slides', blockIndex: number, type: string) => {
    setCurrentModule((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      if (!newSlides[blockIndex]) return prev;
      const sections = [...(newSlides[blockIndex].sections || []), { id: Date.now() + Math.random(), type, content: "", contentEn: "" }];
      newSlides[blockIndex] = { ...newSlides[blockIndex], sections };
      return { ...prev, [source]: newSlides };
    });
  };

  const updateSection = (
    source: 'slides' | 'assignments' | 'questions' = 'slides',
    blockIndex: number,
    sectionIndex: number,
    content: string,
    blockRef?: any,
    sectionRef?: any,
    field: 'content' | 'contentEn' = 'content',
  ) => {
    setCurrentModule((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      const resolvedBlockIndex = findBlockIndex(newSlides, blockIndex, blockRef);
      const block = newSlides[resolvedBlockIndex];
      if (!block) return prev;
      const sections = [...(block.sections || [])];
      const resolvedSectionIndex = sectionRef
        ? sections.findIndex((candidate: any) => candidate === sectionRef || (sectionRef.id != null && candidate?.id === sectionRef.id))
        : sectionIndex;
      const resolvedIdx = resolvedSectionIndex >= 0 ? resolvedSectionIndex : sectionIndex;
      if (resolvedIdx < 0 || !sections[resolvedIdx]) return prev;

      const curSec = sections[resolvedIdx];
      const prevVal = String(curSec[field] || '');
      const updatedSec = { ...curSec, [field]: content };
      if (field === 'contentEn') {
        const curAr = String(curSec.content || '');
        if (curAr && hasArabicLetters(curAr)) {
          updatedSec.content = syncRichTextFormatting(prevVal, content, curAr);
        } else if (!getAutoTranslateEnabled() && (!curAr || (!hasArabicLetters(curAr) && curAr === prevVal))) {
          updatedSec.content = content;
        }
      } else if (field === 'content' && curSec.contentEn) {
        updatedSec.contentEn = syncRichTextFormatting(prevVal, content, String(curSec.contentEn));
      }

      sections[resolvedIdx] = updatedSec;
      newSlides[resolvedBlockIndex] = { ...block, sections };
      return { ...prev, [source]: newSlides };
    });
  };

  const removeSection = (source: 'slides' | 'assignments' | 'questions' = 'slides', blockIndex: number, sectionIndex: number) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا القسم؟" : "Are you sure you want to delete this section?")) return;
    setCurrentModule((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      if (!newSlides[blockIndex]) return prev;
      const sections = [...(newSlides[blockIndex].sections || [])];
      sections.splice(sectionIndex, 1);
      newSlides[blockIndex] = { ...newSlides[blockIndex], sections };
      return { ...prev, [source]: newSlides };
    });
  };

  const moveBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, direction: 'UP' | 'DOWN') => {
    setCurrentModule((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      const targetIndex = direction === 'UP' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newSlides.length) return prev;
      [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
      return { ...prev, [source]: newSlides };
    });
  };

  const insertBlockAt = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, type: 'TEXT' | 'QUESTION') => {
    const isAr = language === 'ar';
    const newBlock = type === 'TEXT'
      ? { id: Date.now() + Math.random(), type: 'TEXT', label: 'CONTENT', title: isAr ? 'محتوى جديد' : 'New Content', titleEn: isAr ? '' : 'New Content', content: "", contentEn: "", text: "", textEn: "", videoUrl: "", sections: [] }
      : { id: Date.now() + Math.random(), type: 'QUESTION', label: 'MCQ', title: isAr ? 'سؤال جديد' : 'New Question', titleEn: isAr ? '' : 'New Question', content: "", contentEn: "", text: "", textEn: "", videoUrl: "", options: ["", "", "", ""], optionsEn: ["", "", "", ""], correctAnswer: "", correctAnswerEn: "", sections: [] };
    setCurrentModule((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      newSlides.splice(index, 0, newBlock);
      return { ...prev, [source]: newSlides };
    });
    showToast?.(isAr ? "تم إدراج الشريحة بنجاح" : "Slide inserted successfully", "success");
  };

  return {
    updateBlock, updateBlockFields, removeBlock, moveBlock, insertBlockAt, updateBlockTypeAndReset,
    addSection, updateSection, removeSection
  };
};
