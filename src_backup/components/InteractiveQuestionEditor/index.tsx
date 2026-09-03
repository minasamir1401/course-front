"use client";
import React from "react";
import { EditorProps } from "./utils";
import { GameGuide } from "./GameGuide";
import McqEditor from "./editors/McqEditor";
import TrueFalseEditor from "./editors/TrueFalseEditor";
import MultiSelectEditor from "./editors/MultiSelectEditor";
import MatchingEditor from "./editors/MatchingEditor";
import DragDropFillEditor from "./editors/DragDropFillEditor";
import GroupSortingEditor from "./editors/GroupSortingEditor";
import ClockEditor from "./editors/ClockEditor";
import MindMapEditor from "./editors/MindMapEditor";
import VideoCheckpointEditor from "./editors/VideoCheckpointEditor";
import NumberLineEditor from "./editors/NumberLineEditor";
import SwipeSortEditor from "./editors/SwipeSortEditor";
import WordSearchEditor from "./editors/WordSearchEditor";
import MazeEditor from "./editors/MazeEditor";
import GeoGebraEditor from "./editors/GeoGebraEditor";
import FlashCardEditor from "./editors/FlashCardEditor";
import MemoryGameEditor from "./editors/MemoryGameEditor";
import WordScrambleEditor from "./editors/WordScrambleEditor";
import SentenceReorderEditor from "./editors/SentenceReorderEditor";
import MathEquationEditor from "./editors/MathEquationEditor";
import SequenceOrderEditor from "./editors/SequenceOrderEditor";
import CrosswordEditor from "./editors/CrosswordEditor";
import CountObjectsEditor from "./editors/CountObjectsEditor";
import ImageLabelEditor from "./editors/ImageLabelEditor";
import ColorMatchEditor from "./editors/ColorMatchEditor";

export default function InteractiveQuestionEditor({ question, onChange, language }: EditorProps) {
  const updateQuestionData = (optionsObj: any, correctAnswerVal: any) => {
    onChange({
      ...question,
      options: typeof optionsObj === "string" ? optionsObj : JSON.stringify(optionsObj),
      correctAnswer: typeof correctAnswerVal === "string" ? correctAnswerVal : JSON.stringify(correctAnswerVal)
    });
  };

  const renderEditor = () => {
    switch (question.type) {
      case "MCQ":
        return <McqEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "TRUE_FALSE":
        return <TrueFalseEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "MULTI_SELECT":
        return <MultiSelectEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "MATCHING":
        return <MatchingEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "DRAG_DROP_FILL":
        return <DragDropFillEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "GROUP_SORTING":
        return <GroupSortingEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "CLOCK":
        return <ClockEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "MIND_MAP":
        return <MindMapEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "VIDEO_CHECKPOINT":
        return <VideoCheckpointEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "NUMBER_LINE":
        return <NumberLineEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "SWIPE_SORT":
        return <SwipeSortEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "MAZE":
        return <MazeEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "WORD_SEARCH":
        return <WordSearchEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "GEOGEBRA":
        return <GeoGebraEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "FLASH_CARD":
        return <FlashCardEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "MEMORY_GAME":
        return <MemoryGameEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "WORD_SCRAMBLE":
        return <WordScrambleEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "SENTENCE_REORDER":
        return <SentenceReorderEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "MATH_EQUATION":
        return <MathEquationEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "SEQUENCE_ORDER":
        return <SequenceOrderEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "CROSSWORD":
        return <CrosswordEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "COUNT_OBJECTS":
        return <CountObjectsEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "IMAGE_LABEL":
        return <ImageLabelEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "COLOR_MATCH":
        return <ColorMatchEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      default:
        return (
          <div className="p-4 text-center text-slate-400 font-bold w-full max-w-full">
            {language === "ar" ? "يرجى تحديد نوع نشاط متاح باليمين للبدء بالتحرير المرئي." : "Please select an available activity type to start visual editing."}
          </div>
        );
    }
  };

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <GameGuide type={question.type} />
      <div className="pt-6 border-t border-slate-100">
        <div key={`${question.type}-${question.id || question.title || 'new'}`}>
          {renderEditor()}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 📝 1. MCQ (اختيار من متعدد)
// -------------------------------------------------------------
// -------------------------------------------------------------
// 📝 1. MCQ (اختيار من متعدد)