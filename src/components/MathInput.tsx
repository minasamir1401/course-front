"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sigma, X, Check, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, Loader2, Trash2, Code } from 'lucide-react';
import { uploadFileToServer, compressImage } from "@/lib/image-utils";
import HtmlRenderer from "./HtmlRenderer";

const IMG_REGEX = /<p[^>]*>\s*<img[^>]+>\s*<\/p>|<img[^>]+>/gi;

interface MathInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export default function MathInput({ value, onChange, placeholder, className = "" }: MathInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mathFormula, setMathFormula] = useState("");
  const [isRawView, setIsRawView] = useState(false);
  const mathContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

  // Extract attached images and clean text part from value
  const images = React.useMemo(() => {
    return value ? (value.match(IMG_REGEX) || []) : [];
  }, [value]);

  const textPart = React.useMemo(() => {
    if (!value) return "";
    return value.replace(IMG_REGEX, "").trim();
  }, [value]);

  // Image Upload States
  const [isImgModalOpen, setIsImgModalOpen] = useState(false);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgWidth, setImgWidth] = useState("100%");
  const [imgAlign, setImgAlign] = useState("center");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImgFile(e.target.files[0]);
      setIsImgModalOpen(true);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTextChange = (newText: string) => {
    if (isRawView) {
      onChange(newText);
      return;
    }
    const combined = newText + (images.length > 0 ? (newText ? " " : "") + images.join("") : "");
    onChange(combined);
  };

  const handleRemoveImage = (imgIdx: number) => {
    const remaining = images.filter((_, idx) => idx !== imgIdx);
    const combined = textPart + (remaining.length > 0 ? (textPart ? " " : "") + remaining.join("") : "");
    onChange(combined);
  };

  const handleImageConfirm = async () => {
    if (!imgFile) return;
    setIsUploading(true);
    try {
      const compressed = await compressImage(imgFile, 800, 800, 0.8);
      const byteString = atob(compressed.split(',')[1]);
      const mimeString = compressed.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const newFile = new File([blob], imgFile.name, { type: mimeString });
      const url = await uploadFileToServer(newFile);

      let margin = "10px auto";
      if (imgAlign === "left") margin = "10px auto 10px 0";
      if (imgAlign === "right") margin = "10px 0 10px auto";

      const htmlStr = `<p><img loading="lazy" decoding="async" src="${url}" style="max-width: ${imgWidth}; height: auto; border-radius: 12px; margin: ${margin}; display: block;" /></p>`;
      
      if (isRawView) {
        const valStart = inputRef.current?.selectionStart || value.length;
        const before = value.substring(0, valStart);
        const after = value.substring(valStart);
        onChange(before + htmlStr + after);
      } else {
        const newImages = [...images, htmlStr];
        const combined = (textPart ? textPart + " " : "") + newImages.join("");
        onChange(combined);
      }
      
      setIsImgModalOpen(false);
      setImgFile(null);
    } catch (err: any) {
      console.error("Failed to upload image", err);
      alert(`Failed to upload image. Please try again.\nReason: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    let mf: any = null;
    if (isOpen) {
      const timer = setTimeout(() => {
        if (mathContainerRef.current) {
          import('mathlive').then(({ MathfieldElement }) => {
            if (!mathContainerRef.current) return;
            mf = new MathfieldElement();
            
            const activeVal = isRawView ? value : textPart;
            let initialFormula = "";
            const openDelim = "\\(";
            const closeDelim = "\\)";
            const startIdx = activeVal.indexOf(openDelim);
            if (startIdx !== -1) {
              const endIdx = activeVal.lastIndexOf(closeDelim);
              if (endIdx > startIdx) {
                initialFormula = activeVal.substring(startIdx + openDelim.length, endIdx);
              }
            }
            
            mf.value = initialFormula || "";
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
  }, [isOpen, value, isRawView, textPart]);

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (mathFormula) {
      const formulaText = `\\(${mathFormula}\\)`;
      if (isRawView) {
        if (selectionStart !== null && selectionEnd !== null) {
          const before = value.substring(0, selectionStart);
          const after = value.substring(selectionEnd);
          onChange(before + formulaText + after);
        } else {
          onChange(value + formulaText);
        }
      } else {
        if (selectionStart !== null && selectionEnd !== null) {
          const before = textPart.substring(0, selectionStart);
          const after = textPart.substring(selectionEnd);
          const newText = before + formulaText + after;
          const combined = newText + (images.length > 0 ? (newText ? " " : "") + images.join("") : "");
          onChange(combined);
        } else {
          const newText = textPart + (textPart ? " " : "") + formulaText;
          const combined = newText + (images.length > 0 ? (newText ? " " : "") + images.join("") : "");
          onChange(combined);
        }
      }
    }
    setIsOpen(false);
  };

  const insertCmd = (cmd: string) => {
    const mf = mathContainerRef.current?.firstChild as any;
    if (mf) { mf.insert(cmd); mf.focus(); }
  };

  return (
    <div className={`relative flex-1 flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        value={isRawView ? value : textPart}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent outline-none font-bold text-slate-700 flex-1 w-full"
      />
      {value.includes('<') && (
        <button
          type="button"
          onClick={() => setIsRawView(!isRawView)}
          className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${isRawView ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
          title={isRawView ? "الوضع المرئي" : "عرض كود HTML"}
        >
          <Code className="w-4 h-4" />
        </button>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-all cursor-pointer shrink-0"
        title="إدراج صورة (Insert Image)"
      >
        <ImageIcon className="w-4 h-4" />
      </button>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif" 
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
      </div>

      {/* Clean Attached Images Preview */}
      {!isRawView && images.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1.5 w-full">
          {images.map((imgHtml, idx) => (
            <div key={idx} className="relative group rounded-2xl border border-slate-200 bg-white p-2 shadow-sm overflow-hidden flex flex-col items-center justify-center max-w-[240px] transition-all hover:border-indigo-300">
              <div className="w-full flex justify-center">
                <HtmlRenderer html={imgHtml} />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white shadow transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                title="حذف الصورة"
              >
                <Trash2 className="w-3 h-3" />
                <span>حذف</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Math Preview if input contains LaTeX */}
      {!isRawView && (textPart.includes('\\(') || textPart.includes('\\[')) && (
        <div className="p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl overflow-hidden mt-1 w-full text-xs text-indigo-950 flex items-center gap-2">
          <span className="text-[10px] font-black text-indigo-500 shrink-0">معاينة المعادلة:</span>
          <div className="flex-1">
            <HtmlRenderer html={textPart} />
          </div>
        </div>
      )}

      {/* Fallback Raw HTML Preview if in raw view */}
      {isRawView && (value.includes('\\(') || value.includes('\\[') || value.includes('<img')) && (
         <div className="p-2 bg-white border border-slate-200 rounded-lg overflow-hidden mt-1 w-full text-sm">
           <HtmlRenderer html={value} />
         </div>
      )}

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[9999]"
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] bg-white border border-slate-200 p-5 rounded-3xl shadow-2xl w-full max-w-[380px] max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200 flex flex-col gap-3"
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
                
                {/* Math Functions Row 1: Fractions, Powers, Roots */}
                <div className="flex gap-1">
                  <button type="button" onClick={() => insertCmd('\\frac{#?}{#?}')} className="flex-1 py-1 bg-indigo-50 text-indigo-700 rounded-lg shadow-sm font-black hover:bg-indigo-100 active:scale-95 transition-all text-[11px]">½ كسر</button>
                  <button type="button" onClick={() => insertCmd('^{#?}')} className="flex-1 py-1 bg-indigo-50 text-indigo-700 rounded-lg shadow-sm font-black hover:bg-indigo-100 active:scale-95 transition-all text-[11px]">x² أُس</button>
                  <button type="button" onClick={() => insertCmd('\\sqrt{#?}')} className="flex-1 py-1 bg-indigo-50 text-indigo-700 rounded-lg shadow-sm font-black hover:bg-indigo-100 active:scale-95 transition-all text-[11px]">√ جذر</button>
                  <button type="button" onClick={() => insertCmd('\\left(#?\\right)')} className="flex-1 py-1 bg-indigo-50 text-indigo-700 rounded-lg shadow-sm font-black hover:bg-indigo-100 active:scale-95 transition-all text-[11px]">( ) أقواس</button>
                </div>

                {/* Comparison operators row - مهم لدروس أكبر/أصغر */}
                <div className="flex gap-1">
                  <button type="button" onClick={() => insertCmd('<')} className="flex-1 py-1.5 bg-amber-50 text-amber-700 rounded-lg shadow-sm font-black hover:bg-amber-100 active:scale-95 transition-all text-sm border border-amber-200">&lt; أصغر</button>
                  <button type="button" onClick={() => insertCmd('>')} className="flex-1 py-1.5 bg-amber-50 text-amber-700 rounded-lg shadow-sm font-black hover:bg-amber-100 active:scale-95 transition-all text-sm border border-amber-200">&gt; أكبر</button>
                  <button type="button" onClick={() => insertCmd('\\leq')} className="flex-1 py-1.5 bg-amber-50 text-amber-700 rounded-lg shadow-sm font-black hover:bg-amber-100 active:scale-95 transition-all text-sm border border-amber-200">≤ أصغر أو =</button>
                  <button type="button" onClick={() => insertCmd('\\geq')} className="flex-1 py-1.5 bg-amber-50 text-amber-700 rounded-lg shadow-sm font-black hover:bg-amber-100 active:scale-95 transition-all text-sm border border-amber-200">≥ أكبر أو =</button>
                </div>

                {/* Numbers & Operators Grid */}
                <div className="grid grid-cols-4 gap-1">
                  {['7', '8', '9', '+'].map(btn => (
                    <button type="button" key={btn} onClick={() => insertCmd(btn)} className="py-1 bg-white rounded-lg shadow-sm font-bold text-sm hover:bg-slate-100 text-slate-700 active:scale-95 transition-all">{btn}</button>
                  ))}
                  {['4', '5', '6', '-'].map(btn => (
                    <button type="button" key={btn} onClick={() => insertCmd(btn)} className="py-1 bg-white rounded-lg shadow-sm font-bold text-sm hover:bg-slate-100 text-slate-700 active:scale-95 transition-all">{btn}</button>
                  ))}
                  {['1', '2', '3', '*'].map(btn => (
                    <button type="button" key={btn} onClick={() => insertCmd(btn === '*' ? '\\cdot' : btn)} className="py-1 bg-white rounded-lg shadow-sm font-bold text-sm hover:bg-slate-100 text-slate-700 active:scale-95 transition-all">{btn === '*' ? '×' : btn}</button>
                  ))}
                  {['0', '.', '=', '/'].map(btn => (
                    <button type="button" key={btn} onClick={() => insertCmd(btn === '/' ? '\\div' : btn)} className="py-1 bg-white rounded-lg shadow-sm font-bold text-sm hover:bg-slate-100 text-slate-700 active:scale-95 transition-all">{btn === '/' ? '÷' : btn}</button>
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

      {isImgModalOpen && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[9999]"
            onClick={() => !isUploading && setIsImgModalOpen(false)}
          />
          <div 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] bg-white border border-slate-200 p-5 rounded-3xl shadow-2xl w-full max-w-[320px] animate-in zoom-in-95 duration-200 flex flex-col gap-4"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h4 className="font-black text-slate-800 flex items-center gap-2 text-xs">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                إعدادات الصورة
              </h4>
              <button 
                type="button" 
                onClick={() => !isUploading && setIsImgModalOpen(false)} 
                disabled={isUploading}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">حجم الصورة (العرض)</label>
                <select 
                  value={imgWidth}
                  onChange={(e) => setImgWidth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="100%">100% (كامل العرض)</option>
                  <option value="75%">75%</option>
                  <option value="50%">50% (نصف العرض)</option>
                  <option value="25%">25%</option>
                  <option value="100px">صغير جداً (100px)</option>
                  <option value="auto">الحجم الأصلي (auto)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">المحاذاة</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setImgAlign("right")} className={`flex-1 p-2 rounded-xl flex justify-center items-center transition-colors border ${imgAlign === 'right' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}><AlignRight className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setImgAlign("center")} className={`flex-1 p-2 rounded-xl flex justify-center items-center transition-colors border ${imgAlign === 'center' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}><AlignCenter className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setImgAlign("left")} className={`flex-1 p-2 rounded-xl flex justify-center items-center transition-colors border ${imgAlign === 'left' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}><AlignLeft className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isUploading}
              onClick={handleImageConfirm}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all text-xs flex items-center justify-center gap-1.5 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {isUploading ? 'جاري الرفع...' : 'رفع وإدراج'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
