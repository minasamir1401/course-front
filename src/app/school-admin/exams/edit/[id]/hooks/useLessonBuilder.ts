// @ts-nocheck
export const useLessonBuilder = (props: any) => {
  const { currentModule, setCurrentModule, showToast, language } = props;

  const updateBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, field: string, value: any, blockRef?: any) => {
    setCurrentModule((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      const resolvedIndex = blockRef
        ? newSlides.findIndex((candidate: any) => candidate === blockRef || (blockRef.id != null && candidate?.id === blockRef.id))
        : index;
      if (resolvedIndex < 0 || !newSlides[resolvedIndex]) return prev;
      newSlides[resolvedIndex] = { ...newSlides[resolvedIndex], [field]: value };
      if (field === 'content') {
        newSlides[resolvedIndex].text = value;
      } else if (field === 'text') {
        newSlides[resolvedIndex].content = value;
      }
return { ...prev, [source]: newSlides };
    });
  };

  const updateBlockTypeAndReset = (source: 'slides' | 'assignments' | 'questions', index: number, newType: string) => {
    const isOldSimple = ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(newType);
    let defaultOptions: any = ["", "", "", ""];
    let defaultCorrect = "";
    
    if (newType === 'TRUE_FALSE') {
      defaultOptions = language === 'ar' ? ["صحيح", "خطأ"] : ["True", "False"];
      defaultCorrect = language === 'ar' ? "صحيح" : "True";
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
    
    setCurrentModule((prev: any) => {
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
      const sections = [...(newSlides[blockIndex].sections || []), { id: Date.now() + Math.random(), type, content: "" }];
      newSlides[blockIndex] = { ...newSlides[blockIndex], sections };
      return { ...prev, [source]: newSlides };
    });
  };

  const updateSection = (source: 'slides' | 'assignments' | 'questions' = 'slides', blockIndex: number, sectionIndex: number, content: string, blockRef?: any, sectionRef?: any) => {
    setCurrentModule((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      const resolvedBlockIndex = blockRef
        ? newSlides.findIndex((candidate: any) => candidate === blockRef || (blockRef.id != null && candidate?.id === blockRef.id))
        : blockIndex;
      const block = newSlides[resolvedBlockIndex];
      if (!block) return prev;
      const sections = [...(block.sections || [])];
      const resolvedSectionIndex = sectionRef
        ? sections.findIndex((candidate: any) => candidate === sectionRef || (sectionRef.id != null && candidate?.id === sectionRef.id))
        : sectionIndex;
      if (resolvedSectionIndex < 0 || !sections[resolvedSectionIndex]) return prev;
      sections[resolvedSectionIndex] = { ...sections[resolvedSectionIndex], content };
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
    const newBlock = type === 'TEXT' 
      ? { id: Date.now() + Math.random(), type: 'TEXT', label: 'CONTENT', title: "New Content", content: "", text: "", videoUrl: "", sections: [] }
      : { id: Date.now() + Math.random(), type: 'QUESTION', label: 'MCQ', title: "New Question", content: "", text: "", videoUrl: "", options: ["", "", "", ""], correctAnswer: "", sections: [] };
    setCurrentModule((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      newSlides.splice(index, 0, newBlock);
      return { ...prev, [source]: newSlides };
    });
    showToast("Slide inserted successfully", "success");
  };

  return {
    updateBlock, removeBlock, moveBlock, insertBlockAt, updateBlockTypeAndReset,
    addSection, updateSection, removeSection
  };
};
