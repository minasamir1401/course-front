"use client";

import React, { useRef } from "react";
import dynamic from "next/dynamic";

import McqRenderer from "./interactive-question-renderer/renderers/McqRenderer";
import TrueFalseRenderer from "./interactive-question-renderer/renderers/TrueFalseRenderer";
import MultiSelectRenderer from "./interactive-question-renderer/renderers/MultiSelectRenderer";
import MatchingRenderer from "./interactive-question-renderer/renderers/MatchingRenderer";
import DragDropFillRenderer from "./interactive-question-renderer/renderers/DragDropFillRenderer";
import GroupSortingRenderer from "./interactive-question-renderer/renderers/GroupSortingRenderer";
import ClockRenderer from "./interactive-question-renderer/renderers/ClockRenderer";
import MindMapRenderer from "./interactive-question-renderer/renderers/MindMapRenderer";
import VideoCheckpointRenderer from "./interactive-question-renderer/renderers/VideoCheckpointRenderer";
import NumberLineRenderer from "./interactive-question-renderer/renderers/NumberLineRenderer";
import SwipeSortRenderer from "./interactive-question-renderer/renderers/SwipeSortRenderer";
import FlashCardRenderer from "./interactive-question-renderer/renderers/FlashCardRenderer";
import MemoryGameRenderer from "./interactive-question-renderer/renderers/MemoryGameRenderer";
import WordScrambleRenderer from "./interactive-question-renderer/renderers/WordScrambleRenderer";
import SentenceReorderRenderer from "./interactive-question-renderer/renderers/SentenceReorderRenderer";
import MathEquationRenderer from "./interactive-question-renderer/renderers/MathEquationRenderer";
import SequenceOrderRenderer from "./interactive-question-renderer/renderers/SequenceOrderRenderer";
import CountObjectsRenderer from "./interactive-question-renderer/renderers/CountObjectsRenderer";
import ImageLabelRenderer from "./interactive-question-renderer/renderers/ImageLabelRenderer";
import ColorMatchRenderer from "./interactive-question-renderer/renderers/ColorMatchRenderer";

// Keep only complex canvas/third-party game renderers dynamically imported
const MazeRenderer = dynamic(() => import("./interactive-question-renderer/renderers/MazeRenderer"), { ssr: false });
const WordSearchRenderer = dynamic(() => import("./interactive-question-renderer/renderers/WordSearchRenderer"), { ssr: false });
const GeoGebraRenderer = dynamic(() => import("./interactive-question-renderer/renderers/GeoGebraRenderer"), { ssr: false });
const CrosswordRenderer = dynamic(() => import("./interactive-question-renderer/renderers/CrosswordRenderer"), { ssr: false });

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
    // Arabic: if AR options are empty, fall back to EN options (e.g. electron configs stored only in optionsEn)
    const arOpts = question?.options;
    const enOpts = question?.optionsEn;
    const arOptsEmpty =
      !arOpts ||
      (Array.isArray(arOpts) && arOpts.filter(Boolean).length === 0) ||
      (typeof arOpts === 'string' && arOpts.trim().length === 0);
    return {
      ...question,
      options: arOptsEmpty ? (enOpts ?? arOpts) : arOpts,
    };
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
