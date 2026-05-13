"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bold, Italic, Underline, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight,
  Type, Eraser, Palette, Heading1, Heading2,
  ChevronDown, Image as ImageIcon, Table, Sigma, X
} from "lucide-react";
import { compressImage } from "@/lib/image-utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, className = "" }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [activeModal, setActiveModal] = useState<'table' | 'math' | 'image' | null>(null);
  const [tableConfig, setTableConfig] = useState({ rows: "3", cols: "3" });
  const [mathFormula, setMathFormula] = useState("x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}");
  const [imageSettings, setImageSettings] = useState({ src: "", width: "100", align: "center" as 'left' | 'center' | 'right' });
  const [editingImage, setEditingImage] = useState<HTMLImageElement | null>(null);

  const COLORS = [
    { name: 'Default', color: '#000000' },
    { name: 'Blue', color: '#2563eb' },
    { name: 'Red', color: '#dc2626' },
    { name: 'Green', color: '#16a34a' },
    { name: 'Purple', color: '#9333ea' },
    { name: 'Indigo', color: '#6366f1' },
    { name: 'Rose', color: '#f43f5e' },
    { name: 'Emerald', color: '#10b981' },
    { name: 'Amber', color: '#f59e0b' },
  ];

  // Initialize and keep in sync
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (!isFocused) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value, isFocused]);

  const execCommand = (command: string, cmdValue?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, cmdValue);
    handleInput();
  };


  const insertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        try {
          // Use client-side compression (max 1200px, 70% quality)
          const compressedContent = await compressImage(file, 1200, 1200, 0.7);
          setImageSettings({ src: compressedContent, width: "100", align: "center" });
          setEditingImage(null);
          setActiveModal('image');
        } catch (error) {
          console.error("Compression failed:", error);
          // Fallback to original if compression fails
          const reader = new FileReader();
          reader.onload = (readerEvent) => {
            const content = readerEvent.target?.result as string;
            setImageSettings({ src: content, width: "100", align: "center" });
            setEditingImage(null);
            setActiveModal('image');
          };
          reader.readAsDataURL(file);
        }
      }
    };
    input.click();
  };

  const handleInsertImage = () => {
    if (editingImage) {
      applyImageSettings(editingImage);
    } else {
      const floatStyle = imageSettings.align === 'center' ? 'none' : imageSettings.align;
      const marginStyle = imageSettings.align === 'center' ? '10px auto' : 
                          imageSettings.align === 'right' ? '10px 0 10px 20px' : '10px 20px 10px 0';
      const displayStyle = imageSettings.align === 'center' ? 'block' : 'inline-block';
      
      const imgHtml = `<img src="${imageSettings.src}" style="width: ${imageSettings.width}%; max-width: 100%; height: auto; border-radius: 12px; margin: ${marginStyle}; display: ${displayStyle}; float: ${floatStyle};" />&nbsp;`;
      execCommand('insertHTML', imgHtml);
    }
    setActiveModal(null);
    setEditingImage(null);
  };

  const applyImageSettings = (img: HTMLImageElement) => {
    const floatStyle = imageSettings.align === 'center' ? 'none' : imageSettings.align;
    const marginStyle = imageSettings.align === 'center' ? '10px auto' : 
                        imageSettings.align === 'right' ? '10px 0 10px 20px' : '10px 20px 10px 0';
    const displayStyle = imageSettings.align === 'center' ? 'block' : 'inline-block';
    
    img.style.width = `${imageSettings.width}%`;
    img.style.float = floatStyle;
    img.style.margin = marginStyle;
    img.style.display = displayStyle;
    handleInput();
  };

  useEffect(() => {
    const handleEditorClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        const img = e.target as HTMLImageElement;
        setEditingImage(img);
        setImageSettings({
          src: img.src,
          width: img.style.width.replace('%', '') || "100",
          align: (img.style.float as any) || 'center'
        });
        setActiveModal('image');
      }
    };

    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('click', handleEditorClick);
      return () => editor.removeEventListener('click', handleEditorClick);
    }
  }, []);

  const handleInsertTable = () => {
    const rows = parseInt(tableConfig.rows) || 3;
    const cols = parseInt(tableConfig.cols) || 3;
    let tableHtml = '<table style="width:100%; border-collapse: collapse; border: 1px solid #ddd; margin: 10px 0;">';
    for (let i = 0; i < rows; i++) {
      tableHtml += '<tr>';
      for (let j = 0; j < cols; j++) {
        tableHtml += '<td style="border: 1px solid #ddd; padding: 8px; min-height: 20px;">&nbsp;</td>';
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</table><p>&nbsp;</p>';
    execCommand('insertHTML', tableHtml);
    setActiveModal(null);
  };

  const handleInsertMath = () => {
    if (mathFormula) {
      const mathHtml = `<span class="math-tex" style="font-family: 'Times New Roman', serif; font-style: italic; background: #f8fafc; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">${mathFormula}</span>&nbsp;`;
      execCommand('insertHTML', mathHtml);
    }
    setActiveModal(null);
  };

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => {
    setIsFocused(false);
    handleInput();
  };

  const ToolButton = ({
    onClick,
    icon: Icon,
    title,
    active = false,
    className = ""
  }: {
    onClick: () => void;
    icon: any;
    title: string;
    active?: boolean;
    className?: string;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center hover:scale-110 active:scale-95 ${active
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
          : "text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm"
        } ${className}`}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className={`flex flex-col border-2 rounded-[30px] transition-all duration-300 bg-white ${isFocused
        ? 'border-indigo-500 ring-8 ring-indigo-500/5 shadow-2xl'
        : 'border-slate-100 hover:border-slate-200 shadow-sm'
      } ${className} relative`}>

      {/* Toolbar */}
      <div className="bg-slate-50/50 backdrop-blur-md border-b border-slate-100 p-2.5 flex flex-wrap gap-1.5 items-center rounded-t-[28px]">
        <ToolButton onClick={() => execCommand('bold')} icon={Bold} title="عريض" />
        <ToolButton onClick={() => execCommand('italic')} icon={Italic} title="مائل" />
        <ToolButton onClick={() => execCommand('underline')} icon={Underline} title="تحت خط" />

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <ToolButton onClick={() => execCommand('formatBlock', 'h1')} icon={Heading1} title="عنوان كبير" />
        <ToolButton onClick={() => execCommand('formatBlock', 'h2')} icon={Heading2} title="عنوان متوسط" />

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <select
          onChange={(e) => execCommand('fontSize', e.target.value)}
          className="bg-transparent text-xs font-bold text-slate-500 outline-none hover:text-indigo-600 cursor-pointer p-1"
          title="حجم الخط"
        >
          <option value="">حجم الخط</option>
          <option value="1">صغير جداً</option>
          <option value="2">صغير</option>
          <option value="3">عادي</option>
          <option value="4">متوسط</option>
          <option value="5">كبير</option>
          <option value="6">كبير جداً</option>
          <option value="7">ضخم</option>
        </select>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <ToolButton onClick={() => execCommand('insertUnorderedList')} icon={List} title="نقاط" />
        <ToolButton onClick={() => execCommand('insertOrderedList')} icon={ListOrdered} title="ترقيم" />

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <ToolButton onClick={() => execCommand('justifyLeft')} icon={AlignLeft} title="محاذاة لليسار" />
        <ToolButton onClick={() => execCommand('justifyCenter')} icon={AlignCenter} title="توسيط" />
        <ToolButton onClick={() => execCommand('justifyRight')} icon={AlignRight} title="محاذاة لليمين" />

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <ToolButton onClick={insertImage} icon={ImageIcon} title="إدراج صورة" />
        <ToolButton onClick={() => setActiveModal('table')} icon={Table} title="إدراج جدول" />
        <ToolButton onClick={() => setActiveModal('math')} icon={Sigma} title="إدراج معادلة" />
        <div className="w-px h-6 bg-slate-200 mx-1" />

        <div className="flex flex-wrap items-center justify-center gap-1.5 px-2 bg-slate-100/50 rounded-2xl py-1.5 min-w-[140px]">
          <span className="text-[9px] font-black text-slate-400 uppercase ml-1">اللون:</span>
          {COLORS.map(c => (
            <button
              key={c.name}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCommand('foreColor', c.color);
              }}
              className="group relative flex items-center justify-center"
              title={c.name}
            >
              <div
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm transition-all duration-200 hover:scale-125 hover:shadow-md"
                style={{ backgroundColor: c.color }}
              />
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <ToolButton
          onClick={() => execCommand('removeFormat')}
          icon={Eraser}
          title="مسح التنسيق"
          className="hover:text-red-500 hover:bg-red-50"
        />
      </div>

      {/* Inline Modals */}
      {activeModal === 'table' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-white border border-slate-200 p-6 rounded-3xl shadow-2xl min-w-[300px] animate-in zoom-in-95 duration-200 rtl" dir="rtl">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-black text-slate-800 flex items-center gap-2">
              <Table className="w-5 h-5 text-indigo-600" />
              إدراج جدول
            </h4>
            <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">عدد الصفوف</label>
              <input
                type="number"
                value={tableConfig.rows}
                onChange={(e) => setTableConfig({ ...tableConfig, rows: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 font-bold"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">عدد الأعمدة</label>
              <input
                type="number"
                value={tableConfig.cols}
                onChange={(e) => setTableConfig({ ...tableConfig, cols: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 font-bold"
              />
            </div>
          </div>
          <button
            onClick={handleInsertTable}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
          >
            تأكيد الإدراج
          </button>
        </div>
      )}

      {activeModal === 'image' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-white border border-slate-200 p-6 rounded-3xl shadow-2xl min-w-[350px] animate-in zoom-in-95 duration-200 rtl" dir="rtl">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-black text-slate-800 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-600" />
              إعدادات الصورة
            </h4>
            <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="space-y-6 mb-8">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">العرض (%)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={imageSettings.width}
                  onChange={(e) => setImageSettings({ ...imageSettings, width: e.target.value })}
                  className="flex-1 accent-indigo-600"
                />
                <span className="font-bold text-slate-700 w-12">{imageSettings.width}%</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المحاذاة والالتفاف</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'left', label: 'يسار', icon: AlignLeft },
                  { id: 'center', label: 'توسيط', icon: AlignCenter },
                  { id: 'right', label: 'يمين', icon: AlignRight },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => setImageSettings({ ...imageSettings, align: pos.id as any })}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${imageSettings.align === pos.id ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'}`}
                  >
                    <pos.icon className="w-4 h-4" />
                    <span className="text-[10px] font-bold">{pos.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleInsertImage}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            {editingImage ? 'تحديث الإعدادات' : 'إدراج الصورة'}
          </button>
        </div>
      )}
      {activeModal === 'math' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-white border border-slate-200 p-6 rounded-3xl shadow-2xl min-w-[400px] animate-in zoom-in-95 duration-200 rtl" dir="rtl">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-black text-slate-800 flex items-center gap-2">
              <Sigma className="w-5 h-5 text-indigo-600" />
              إدراج معادلة LaTeX
            </h4>
            <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex flex-col gap-3 mb-6">
            <textarea
              value={mathFormula}
              onChange={(e) => setMathFormula(e.target.value)}
              placeholder="مثال: E=mc²"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-mono text-sm min-h-[100px]"
            />
            <p className="text-[10px] text-slate-400 leading-relaxed">
              * سيتم إدراج المعادلة كنص منسق. يمكنك استخدام رموز LaTeX المعروفة.
            </p>
          </div>
          <button
            onClick={handleInsertMath}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
          >
            إدراج المعادلة
          </button>
        </div>
      )}
      <div className="relative min-h-[150px] bg-white group">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="p-6 md:p-8 outline-none text-lg min-h-[150px] prose prose-slate max-w-none rtl editor-content"
          style={{
            direction: 'rtl',
            textAlign: 'right',
          }}
          suppressContentEditableWarning
        />
        <style jsx global>{`
          .editor-content img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 10px 0;
            border-radius: 12px;
            cursor: pointer;
            transition: outline 0.2s;
          }
          .editor-content img:hover {
            outline: 3px solid #6366f1;
          }
          .editor-content table {
            border-collapse: collapse;
            width: 100%;
            margin: 1rem 0;
          }
          .editor-content table td, .editor-content table th {
            border: 1px solid #e2e8f0;
            padding: 8px;
          }
        `}</style>

        {!value && !isFocused && (
          <div className="absolute top-6 right-6 md:top-8 md:right-8 text-slate-300 pointer-events-none text-lg italic transition-opacity group-hover:opacity-60">
            {placeholder || "اكتب هنا..."}
          </div>
        )}
      </div>

      <div className="bg-slate-50/30 px-6 py-2 border-t border-slate-50 flex justify-end rounded-b-[28px]">
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
          المحرر الاحترافي النشط
        </span>
      </div>
    </div>
  );
}
