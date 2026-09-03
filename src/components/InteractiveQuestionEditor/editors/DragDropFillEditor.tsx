"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function DragDropFillEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { sentence: "", choices: [] });
  const choices = Array.isArray(opts?.choices) ? opts.choices : [];
  const rawCorrect = parseJson(question.correctAnswer, []);
  const correctList = Array.isArray(rawCorrect) ? rawCorrect : (rawCorrect ? [rawCorrect] : []);

  const [sentence, setSentence] = useState(opts.sentence || "");
  const [choiceInput, setChoiceInput] = useState("");
  const [choicesList, setChoicesList] = useState<string[]>(choices);
  const [correctAnswerSlots, setCorrectAnswerSlots] = useState<string[]>(correctList);

  useEffect(() => {
    setSentence(opts.sentence || "");
    setChoicesList(Array.isArray(opts?.choices) ? opts.choices : []);
    const updatedRaw = parseJson(question.correctAnswer, []);
    setCorrectAnswerSlots(Array.isArray(updatedRaw) ? updatedRaw : (updatedRaw ? [updatedRaw] : []));
  }, [question.options, question.correctAnswer]);

  const saveChanges = (newSentence: string, newChoices: string[], newCorrect: string[]) => {
    updateQuestionData({ sentence: newSentence, choices: newChoices }, newCorrect);
  };

  const addChoice = () => {
    if (!choiceInput.trim() || choicesList.includes(choiceInput.trim())) return;
    const updatedChoices = [...choicesList, choiceInput.trim()];
    setChoicesList(updatedChoices);
    setChoiceInput("");
    saveChanges(sentence, updatedChoices, correctAnswerSlots);
  };

  const removeChoice = (word: string) => {
    const updatedChoices = choicesList.filter((c) => c !== word);
    setChoicesList(updatedChoices);
    const updatedSlots = correctAnswerSlots.map((s) => (s === word ? "" : s));
    setCorrectAnswerSlots(updatedSlots);
    saveChanges(sentence, updatedChoices, updatedSlots);
  };

  const handleSlotMapChange = (slotIdx: number, val: string) => {
    const updatedSlots = [...correctAnswerSlots];
    updatedSlots[slotIdx] = val;
    setCorrectAnswerSlots(updatedSlots);
    saveChanges(sentence, choicesList, updatedSlots);
  };

  const insertSlotToken = (token: string) => {
    const el = document.getElementById("sentence-textarea") as HTMLTextAreaElement;
    if (!el) {
      const newSentence = sentence + " " + token;
      setSentence(newSentence);
      saveChanges(newSentence, choicesList, correctAnswerSlots);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const before = text.substring(0, start);
    const after  = text.substring(end, text.length);
    const newText = before + token + after;
    setSentence(newText);
    saveChanges(newText, choicesList, correctAnswerSlots);
    
    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + token.length;
    }, 10);
  };

  const slotsCount = (sentence.match(/\[slot\d+\]/g) || []).length;

  return (
    <div className={`space-y-6 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">
        {language === 'ar' ? "محرر سحب وإفلات الفراغات (Drag & Drop):" : "Drag & Drop Fill in the Blanks Editor:"}
      </h5>
      
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black text-slate-400 leading-relaxed">
            {language === 'ar' ? "اكتب النص الكامل ثم أدرج رمز الفراغ في الموضع المطلوب:" : "Type the text and insert slots where blanks should appear:"}
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {Array.from({ length: Math.min(8, slotsCount + 1) }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => insertSlotToken(`[slot${i}]`)}
                className="text-[9px] font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1 rounded transition-all cursor-pointer"
              >
                {language === 'ar' ? `+ فراغ [slot${i}]` : `+ Slot ${i}`}
              </button>
            ))}
          </div>
        </div>
        <textarea
          id="sentence-textarea"
          className="w-full bg-white border border-slate-250 rounded-2xl p-4 text-xs font-bold text-right focus:border-indigo-500 outline-none transition-all resize-none"
          rows={3}
          value={sentence}
          onChange={(e) => {
            setSentence(e.target.value);
            saveChanges(e.target.value, choicesList, correctAnswerSlots);
          }}
          placeholder={language === 'ar' ? "مثال: تقع أهرامات الجيزة في محافظة [slot0] بينما يقع معبد أبو سمبل في محافظة [slot1]." : "e.g. The pyramids are in [slot0] while Luxor Temple is in [slot1]."}
        />
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 block">{language === 'ar' ? "خيارات الكلمات المتاحة للسحب:" : "Available Word Choices to Drag:"}</label>
        <div className="flex gap-2 w-full">
          <MathInput
            placeholder={language === 'ar' ? "اكتب كلمة/معادلة الخيار الجديدة..." : "Write choice word/equation..."}
            className="flex-1 bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold"
            value={choiceInput}
            onChange={(val) => setChoiceInput(val)}
          />
          <button
            type="button"
            onClick={addChoice}
            className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-500/10 transition-all cursor-pointer shrink-0"
          >
            {language === 'ar' ? "إضافة كلمة/كسر" : "Add Word/Fraction"}
          </button>
        </div>
        
        <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-100 rounded-xl max-h-36 overflow-y-auto">
          {choicesList.length === 0 ? (
            <span className="text-[10px] text-slate-400 font-bold">{language === 'ar' ? "لا توجد كلمات سحب مضافة. أضف كلمات في الحقل أعلاه." : "No drag choices added yet. Add some above."}</span>
          ) : (
            choicesList.map((c, i) => (
              <div key={i} className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-2 text-xs font-bold shadow-sm">
                <span className="text-slate-800">{c}</span>
                <button type="button" onClick={() => removeChoice(c)} className="text-rose-500 hover:text-rose-700 font-black cursor-pointer text-sm">×</button>
              </div>
            ))
          )}
        </div>
      </div>

      {slotsCount > 0 && (
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <h6 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'ar' ? "حدد الكلمة الصحيحة لكل فراغ من النص:" : "Define the Correct Word for each Slot:"}</span>
          </h6>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: slotsCount }).map((_, slotIdx) => (
              <div key={slotIdx} className="p-3 bg-indigo-50/30 border border-indigo-100 rounded-xl flex items-center gap-3 justify-between">
                <span className="font-black text-slate-700 text-xs shrink-0">
                  {language === 'ar' ? `الفراغ [slot${slotIdx}]` : `Slot [slot${slotIdx}]`}:
                </span>
                <select
                  className="bg-white border border-slate-250 rounded-lg px-3 py-1.5 font-bold text-xs flex-1 outline-none"
                  value={correctAnswerSlots[slotIdx] || ""}
                  onChange={(e) => handleSlotMapChange(slotIdx, e.target.value)}
                >
                  <option value="">{language === 'ar' ? "-- اختر الحل --" : "-- Select --"}</option>
                  {choicesList.map((c, idx) => (
                    <option key={idx} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 🗂️ 6. GROUP_SORTING (تصنيف المجموعات)