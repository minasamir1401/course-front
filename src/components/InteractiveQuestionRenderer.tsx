"use client";

import React, { useRef } from "react";
import dynamic from "next/dynamic";
const McqRenderer = dynamic(() => import("./interactive-question-renderer/renderers/McqRenderer"));
const TrueFalseRenderer = dynamic(() => import("./interactive-question-renderer/renderers/TrueFalseRenderer"));
const MultiSelectRenderer = dynamic(() => import("./interactive-question-renderer/renderers/MultiSelectRenderer"));
const MatchingRenderer = dynamic(() => import("./interactive-question-renderer/renderers/MatchingRenderer"));
const DragDropFillRenderer = dynamic(() => import("./interactive-question-renderer/renderers/DragDropFillRenderer"));
const GroupSortingRenderer = dynamic(() => import("./interactive-question-renderer/renderers/GroupSortingRenderer"));
const ClockRenderer = dynamic(() => import("./interactive-question-renderer/renderers/ClockRenderer"));
const MindMapRenderer = dynamic(() => import("./interactive-question-renderer/renderers/MindMapRenderer"));
const VideoCheckpointRenderer = dynamic(() => import("./interactive-question-renderer/renderers/VideoCheckpointRenderer"));
const NumberLineRenderer = dynamic(() => import("./interactive-question-renderer/renderers/NumberLineRenderer"));
const SwipeSortRenderer = dynamic(() => import("./interactive-question-renderer/renderers/SwipeSortRenderer"));
const MazeRenderer = dynamic(() => import("./interactive-question-renderer/renderers/MazeRenderer"));
const WordSearchRenderer = dynamic(() => import("./interactive-question-renderer/renderers/WordSearchRenderer"));
const GeoGebraRenderer = dynamic(() => import("./interactive-question-renderer/renderers/GeoGebraRenderer"));
const FlashCardRenderer = dynamic(() => import("./interactive-question-renderer/renderers/FlashCardRenderer"));
const MemoryGameRenderer = dynamic(() => import("./interactive-question-renderer/renderers/MemoryGameRenderer"));
const WordScrambleRenderer = dynamic(() => import("./interactive-question-renderer/renderers/WordScrambleRenderer"));
const SentenceReorderRenderer = dynamic(() => import("./interactive-question-renderer/renderers/SentenceReorderRenderer"));
const MathEquationRenderer = dynamic(() => import("./interactive-question-renderer/renderers/MathEquationRenderer"));
const SequenceOrderRenderer = dynamic(() => import("./interactive-question-renderer/renderers/SequenceOrderRenderer"));
const CrosswordRenderer = dynamic(() => import("./interactive-question-renderer/renderers/CrosswordRenderer"));
const CountObjectsRenderer = dynamic(() => import("./interactive-question-renderer/renderers/CountObjectsRenderer"));
const ImageLabelRenderer = dynamic(() => import("./interactive-question-renderer/renderers/ImageLabelRenderer"));
const ColorMatchRenderer = dynamic(() => import("./interactive-question-renderer/renderers/ColorMatchRenderer"));

interface QuestionProps {
  question: any;
  value: string; // The current answer stored (serialized JSON or string)
  onChange: (val: string) => void;
  language: string;
}

export default function InteractiveQuestionRenderer({ question, value, onChange, language }: QuestionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const effectiveQuestion = React.useMemo(() => {
    if (language === 'en') {
      return {
        ...question,
        title: question?.titleEn || question?.title,
        text: question?.questionTextEn || question?.textEn || question?.questionText || question?.text,
        questionText: question?.questionTextEn || question?.textEn || question?.questionText || question?.text,
        options: question?.optionsEn || question?.options,
        correctAnswer: question?.correctAnswerEn || question?.correctAnswer,
        explanation: question?.explanationEn || question?.explanation,
        hint: question?.hintEn || question?.hint,
        tip: question?.tipEn || question?.tip,
        keyInsight: question?.keyInsightEn || question?.keyInsight,
      };
    }
    return question;
  }, [question, language]);

  // Render individual component based on type
  const renderWidget = () => {
    // 💡 Fix: Support newer format where type="QUESTION" and label="MCQ"
    const qType = effectiveQuestion.type === "QUESTION" && effectiveQuestion.label ? effectiveQuestion.label : effectiveQuestion.type;

    switch (qType) {
      case "MCQ":
        return <McqRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "TRUE_FALSE":
        return <TrueFalseRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "MULTI_SELECT":
        return <MultiSelectRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "MATCHING":
        return <MatchingRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "DRAG_DROP_FILL":
        return <DragDropFillRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "GROUP_SORTING":
        return <GroupSortingRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "CLOCK":
        return <ClockRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "MIND_MAP":
        return <MindMapRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "VIDEO_CHECKPOINT":
        return <VideoCheckpointRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "NUMBER_LINE":
        return <NumberLineRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "SWIPE_SORT":
        return <SwipeSortRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "MAZE":
        return <MazeRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "WORD_SEARCH":
        return <WordSearchRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "GEOGEBRA":
        return <GeoGebraRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "FLASH_CARD":
        return <FlashCardRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "MEMORY_GAME":
        return <MemoryGameRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "WORD_SCRAMBLE":
        return <WordScrambleRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "SENTENCE_REORDER":
        return <SentenceReorderRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "MATH_EQUATION":
        return <MathEquationRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "SEQUENCE_ORDER":
        return <SequenceOrderRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "CROSSWORD":
        return <CrosswordRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "COUNT_OBJECTS":
        return <CountObjectsRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "IMAGE_LABEL":
        return <ImageLabelRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      case "COLOR_MATCH":
        return <ColorMatchRenderer question={effectiveQuestion} value={value} onChange={onChange} language={language} />;
      default:
        return (
          <div className="p-4 text-center text-slate-400 font-bold">
            {language === 'ar' ? 'نوع النشاط غير مدعوم حالياً' : 'Activity type not supported'}
          </div>
        );
    }
  };

  return (
    <div ref={containerRef} className="w-full relative min-h-[300px]">
      {renderWidget()}
    </div>
  );
}
