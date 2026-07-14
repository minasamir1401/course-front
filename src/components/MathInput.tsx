"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sigma, X, Check } from 'lucide-react';

interface MathInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export default function MathInput({ value, onChange, placeholder, className = "" }: MathInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mathFormula, setMathFormula] = useState("");
  const mathContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

  useEffect(() => {
    let mf: any = null;
    if (isOpen) {
      const timer = setTimeout(() => {
        if (mathContainerRef.current) {
          import('mathlive').then(({ MathfieldElement }) => {
            if (!mathContainerRef.current) return;
            mf = new MathfieldElement();
            
            // Try to extract existing LaTeX if it's already in the value
            // e.g. if value contains \( ... \), extract the formula
            let initialFormula = "";
            const match = value.match(/\\\((.*?)\\\)/);
            if (match) {
              initialFormula = match[1];
            } else {
              // Strip standard markup if present, or just use raw value
              initialFormula = value;
            }
            
            mf.value = initialFormula || "x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}";
            setMathFormula(mf.value);

            mf.style.width = '100%';
            mf.style.padding = '12px 16px';
            mf.style.borderRadius = '0.75rem';
            mf.style.border = '1px solid #e2e8f0';
            mf.style.backgroundColor = '#f8fafc';
            mf.style.outline = 'none';
            mf.style.minHeight = '100px';
            mf.style.fontSize = '20px';
            mf.mathVirtualKeyboardPolicy = 'manual';

            mf.addEventListener('input', () => {
              setMathFormula(mf.value);
            });

            mathContainerRef.current.innerHTML = '';
            mathContainerRef.current.appendChild(mf);
            mf.focus();
          }).catch(err => console.error("Failed to load mathlive", err));
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, value]);

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (mathFormula) {
      const formulaText = `\\(${mathFormula}\\)`;
      if (selectionStart !== null && selectionEnd !== null) {
        const before = value.substring(0, selectionStart);
        const after = value.substring(selectionEnd);
        onChange(before + formulaText + after);
      } else {
        onChange(value + formulaText);
      }
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative flex-1 flex items-center gap-2 ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent outline-none font-bold text-slate-700 flex-1 w-full"
      />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (inputRef.current) {
            setSelectionStart(inputRef.current.selectionStart);
            setSelectionEnd(inputRef.current.selectionEnd);
          } else {
            setSelectionStart(null);
            setSelectionEnd(null);
          }
          setIsOpen(true);
        }}
        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-all cursor-pointer shrink-0"
        title="إدراج معادلة رياضية (Insert Math Equation)"
      >
        <Sigma className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[9999]"
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] bg-white border border-slate-200 p-5 rounded-3xl shadow-2xl w-full max-w-[360px] max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200 flex flex-col gap-3"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-black text-slate-800 flex items-center gap-2 text-xs">
                <Sigma className="w-4 h-4 text-indigo-600" />
                إدراج معادلة رياضية
              </h4>
              <button 
                type="button" 
                onClick={() => setIsOpen(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {/* Custom Keypad */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col gap-1.5 scale-95 origin-top">
                {/* Arrows & Backspace */}
                <div className="flex justify-between gap-1">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.executeCommand('moveToPreviousChar'); mf.focus(); } }} className="w-8 h-8 bg-white rounded-lg shadow-sm font-bold text-base hover:bg-slate-100 active:scale-95 transition-all">←</button>
                    <button type="button" onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.executeCommand('moveUp'); mf.focus(); } }} className="w-8 h-8 bg-white rounded-lg shadow-sm font-bold text-base hover:bg-slate-100 active:scale-95 transition-all">↑</button>
                    <button type="button" onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.executeCommand('moveDown'); mf.focus(); } }} className="w-8 h-8 bg-white rounded-lg shadow-sm font-bold text-base hover:bg-slate-100 active:scale-95 transition-all">↓</button>
                    <button type="button" onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.executeCommand('moveToNextChar'); mf.focus(); } }} className="w-8 h-8 bg-white rounded-lg shadow-sm font-bold text-base hover:bg-slate-100 active:scale-95 transition-all">→</button>
                  </div>
                  <button type="button" onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.executeCommand('deleteBackward'); mf.focus(); } }} className="px-2 h-8 bg-red-100 text-red-600 rounded-lg shadow-sm font-bold hover:bg-red-200 active:scale-95 transition-all text-[10px]">⌫ مسح</button>
                </div>
                
                {/* Functions */}
                <div className="flex gap-1">
                  <button type="button" onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.insert('\\frac{#?}{#?}'); mf.focus(); } }} className="flex-1 py-1 bg-indigo-50 text-indigo-700 rounded-lg shadow-sm font-black hover:bg-indigo-100 active:scale-95 transition-all text-[11px]">½ كسر</button>
                  <button type="button" onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.insert('^{#?}'); mf.focus(); } }} className="flex-1 py-1 bg-indigo-50 text-indigo-700 rounded-lg shadow-sm font-black hover:bg-indigo-100 active:scale-95 transition-all text-[11px]">x² أُس</button>
                  <button type="button" onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.insert('\\sqrt{#?}'); mf.focus(); } }} className="flex-1 py-1 bg-indigo-50 text-indigo-700 rounded-lg shadow-sm font-black hover:bg-indigo-100 active:scale-95 transition-all text-[11px]">√ جذر</button>
                  <button type="button" onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.insert('\\left(#?\\right)'); mf.focus(); } }} className="flex-1 py-1 bg-indigo-50 text-indigo-700 rounded-lg shadow-sm font-black hover:bg-indigo-100 active:scale-95 transition-all text-[11px]">( ) أقواس</button>
                </div>

                {/* Numbers & Operators Grid */}
                <div className="grid grid-cols-4 gap-1">
                  {['7', '8', '9', '+'].map(btn => (
                    <button type="button" key={btn} onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.insert(btn); mf.focus(); } }} className="py-1 bg-white rounded-lg shadow-sm font-bold text-sm hover:bg-slate-100 text-slate-700 active:scale-95 transition-all">{btn}</button>
                  ))}
                  {['4', '5', '6', '-'].map(btn => (
                    <button type="button" key={btn} onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.insert(btn); mf.focus(); } }} className="py-1 bg-white rounded-lg shadow-sm font-bold text-sm hover:bg-slate-100 text-slate-700 active:scale-95 transition-all">{btn}</button>
                  ))}
                  {['1', '2', '3', '*'].map(btn => (
                    <button type="button" key={btn} onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.insert(btn === '*' ? '\\cdot' : btn); mf.focus(); } }} className="py-1 bg-white rounded-lg shadow-sm font-bold text-sm hover:bg-slate-100 text-slate-700 active:scale-95 transition-all">{btn === '*' ? '×' : btn}</button>
                  ))}
                  {['0', '.', '=', '/'].map(btn => (
                    <button type="button" key={btn} onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.insert(btn === '/' ? '\\div' : btn); mf.focus(); } }} className="py-1 bg-white rounded-lg shadow-sm font-bold text-sm hover:bg-slate-100 text-slate-700 active:scale-95 transition-all">{btn === '/' ? '÷' : btn}</button>
                  ))}
                </div>
              </div>

              <div ref={mathContainerRef} className="w-full mt-1" dir="ltr" />
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all text-xs flex items-center justify-center gap-1.5 mt-1 animate-pulse"
            >
              <Check className="w-3.5 h-3.5" />
              تأكيد وإدراج
            </button>
          </div>
        </>
      )}
    </div>
  );
}
