"use client";

import React, { useRef } from "react";
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
import MazeRenderer from "./interactive-question-renderer/renderers/MazeRenderer";
import WordSearchRenderer from "./interactive-question-renderer/renderers/WordSearchRenderer";
import GeoGebraRenderer from "./interactive-question-renderer/renderers/GeoGebraRenderer";
import FlashCardRenderer from "./interactive-question-renderer/renderers/FlashCardRenderer";
import MemoryGameRenderer from "./interactive-question-renderer/renderers/MemoryGameRenderer";
import WordScrambleRenderer from "./interactive-question-renderer/renderers/WordScrambleRenderer";
import SentenceReorderRenderer from "./interactive-question-renderer/renderers/SentenceReorderRenderer";
import MathEquationRenderer from "./interactive-question-renderer/renderers/MathEquationRenderer";
import SequenceOrderRenderer from "./interactive-question-renderer/renderers/SequenceOrderRenderer";
import CrosswordRenderer from "./interactive-question-renderer/renderers/CrosswordRenderer";
import CountObjectsRenderer from "./interactive-question-renderer/renderers/CountObjectsRenderer";
import ImageLabelRenderer from "./interactive-question-renderer/renderers/ImageLabelRenderer";
import ColorMatchRenderer from "./interactive-question-renderer/renderers/ColorMatchRenderer";

interface QuestionProps {
  question: any;
  value: string; // The current answer stored (serialized JSON or string)
  onChange: (val: string) => void;
  language: string;
}

export default function InteractiveQuestionRenderer({ question, value, onChange, language }: QuestionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Render individual component based on type
  const renderWidget = () => {
    // 💡 Fix: Support newer format where type="QUESTION" and label="MCQ"
    const qType = question.type === "QUESTION" && question.label ? question.label : question.type;

    switch (qType) {
      case "MCQ":
        return <McqRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "TRUE_FALSE":
        return <TrueFalseRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "MULTI_SELECT":
        return <MultiSelectRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "MATCHING":
        return <MatchingRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "DRAG_DROP_FILL":
        return <DragDropFillRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "GROUP_SORTING":
        return <GroupSortingRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "CLOCK":
        return <ClockRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "MIND_MAP":
        return <MindMapRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "VIDEO_CHECKPOINT":
        return <VideoCheckpointRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "NUMBER_LINE":
        return <NumberLineRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "SWIPE_SORT":
        return <SwipeSortRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "MAZE":
        return <MazeRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "WORD_SEARCH":
        return <WordSearchRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "GEOGEBRA":
        return <GeoGebraRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "FLASH_CARD":
        return <FlashCardRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "MEMORY_GAME":
        return <MemoryGameRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "WORD_SCRAMBLE":
        return <WordScrambleRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "SENTENCE_REORDER":
        return <SentenceReorderRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "MATH_EQUATION":
        return <MathEquationRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "SEQUENCE_ORDER":
        return <SequenceOrderRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "CROSSWORD":
        return <CrosswordRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "COUNT_OBJECTS":
        return <CountObjectsRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "IMAGE_LABEL":
        return <ImageLabelRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "COLOR_MATCH":
        return <ColorMatchRenderer question={question} value={value} onChange={onChange} language={language} />;
      default:
        return (
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl font-bold border border-amber-200">
            {language === 'ar' ? `نوع السؤال غير مدعوم: ${qType}` : `Unsupported question type: ${qType}`}
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
