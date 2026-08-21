"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Type, Eraser, Palette, Heading1, Heading2, ChevronDown, Image as ImageIcon, Table, Sigma, X, Highlighter, Trash2 } from 'lucide-react';
import { uploadFileToServer } from "@/lib/image-utils";
import { useLanguage } from "@/contexts/LanguageContext";
import katex from "katex";
import "katex/dist/katex.min.css";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function cleanWordPaste(html: string): string {
  if (!html) return html;
  
  let res = html;

  // 0. Extract images from <!--[if !vml]-->...<![endif]--> blocks BEFORE removing them
  // Word embeds equations as images inside these blocks — we must rescue them first!
  res = res.replace(/<!--\[if !vml\]-->([\s\S]*?)<!--\[endif\]-->/gi, (_match: string, inner: string) => {
    // Extract any <img> tags inside the block and keep them
    const imgMatches = inner.match(/<img[^>]+>/gi);
    if (imgMatches) {
      return imgMatches
        .map((img: string) => img.replace(/\s+v:shapes="[^"]*"/gi, '').replace(/\s+o:title="[^"]*"/gi, ''))
        .join(' ');
    }
    return '';
  });

  // 0.1 Remove msEquation MathML blocks (we keep the image fallback from step 0)
  res = res.replace(/<!--\[if gte msEquation[^\]]*\]>[\s\S]*?<!\[endif\]-->/gi, '');

  // 0.2 Remove VML shapetype/shape definitions (the rendered image was already extracted in step 0)
  res = res.replace(/<!--\[if gte vml[^\]]*\]>[\s\S]*?<!\[endif\]-->/gi, '');

  // 0.3 Remove remaining MSO conditional comments (includes <!--[if !msEquation]--> wrappers)
  res = res.replace(/<!--\[if[^\]]*\]-->/gi, '');
  res = res.replace(/<!--\[endif\]-->/gi, '');

  // 1. Remove <o:p> tags
  res = res.replace(/<o:p[^>]*>[\s\S]*?<\/o:p>/gi, '');
  res = res.replace(/<\/o:p>/gi, '');

  // 2. Remove MSO "Question X (Level)" title paragraph if it exists as a standalone line
  // e.g. <p class="MsoNormal"><b><span ...>Question 5 (Medium)</span></b></p>
  res = res.replace(/<p[^>]*MsoNormal[^>]*>\s*<b>\s*<span[^>]*>Question\s+\d+[^<]*<\/span>\s*<\/b>\s*<\/p>/gi, '');

  // 3. Convert Symbol font
  res = res.replace(
    /<span[^>]*font-family:\s*Symbol[^>]*>([\s\S]*?)<\/span>/gi,
    (_match: string, inner: string) => {
      return inner.replace(/·/g, '•').replace(/\uFFFD/g, '•');
    }
  );

  // 4. Remove mso-* style properties
  res = res.replace(/\s*mso-[^;:"']+:[^;]*(;|(?="))/gi, '$1');

  // 5. Smart replacement for \uFFFD (Unicode Replacement Character)
  res = res.replace(/(>|^)([^<]+)(<|$)/g, (match, prefix, textContent, suffix) => {
      let s = textContent;
      if (!s.includes('\uFFFD')) return match;

      // Degree
      s = s.replace(/\uFFFD([CF])/g, '°$1');
      // Formulas
      s = s.replace(/\uFFFDmv\uFFFD/gi, '½mv²');
      s = s.replace(/Mass\s*\uFFFD\s*Volume/gi, 'Mass ÷ Volume');
      s = s.replace(/Mass\s*\uFFFD\s*Acceleration/gi, 'Mass × Acceleration');
      s = s.replace(/Length\s*\uFFFD\s*Width/gi, 'Length × Width');
      s = s.replace(/Width\s*\uFFFD\s*Height/gi, 'Width × Height');
      s = s.replace(/m\s*\uFFFD\s*a/gi, 'm × a');
      s = s.replace(/F\s*\uFFFD\s*d/gi, 'F × d');
      s = s.replace(/I\s*\uFFFD\s*t/gi, 'I × t');
      // Units
      s = s.replace(/s\uFFFD/g, 's²');
      s = s.replace(/([c]?m)\uFFFD/g, '$1²');
      s = s.replace(/kg\uFFFDm/g, 'kg·m');
      s = s.replace(/A\uFFFDs/g, 'A·s');
      s = s.replace(/N\uFFFDm/g, 'N·m');
      // Powers of 10
      s = s.replace(/10\uFFFD\uFFFD/g, '10⁻²');
      s = s.replace(/10\uFFFD(?!\d)/g, '10²');
      // Root/Radical
      s = s.replace(/\uFFFD(?=\s*[(x\d])/g, '√');
      // General number operations
      s = s.replace(/(\d)\s*\uFFFD\s*(\d)/g, '$1 × $2');
      s = s.replace(/ \uFFFD /g, ' × ');
      
      // Remove unhandled replacements
      s = s.replace(/\uFFFD/g, '');

      return prefix + s + suffix;
  });

  return res;
}


export default function RichTextEditor({ value, onChange, placeholder = "", className = "" }: RichTextEditorProps) {
  const { language } = useLanguage();
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [activeModal, setActiveModal] = useState<'table' | 'math' | 'image' | null>(null);
  const [tableConfig, setTableConfig] = useState({ rows: "3", cols: "3" });
  const [mathFormula, setMathFormula] = useState("x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}");
  const [imageSettings, setImageSettings] = useState({ src: "", width: "100", align: "center" as 'left' | 'center' | 'right' });
  const [editingImage, setEditingImage] = useState<HTMLImageElement | null>(null);
  const [imageRect, setImageRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const mathContainerRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

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
    // Intercept and fix any legacy/absolute image URLs pointing to the backend domain
    const cleanValue = (value || "").replace(/https?:\/\/([a-zA-Z0-9.-]+)\/uploads\//g, "/uploads/");

    if (editorRef.current && editorRef.current.innerHTML !== cleanValue) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = cleanValue;
      }
    }
  }, [value, isFocused]);

  // Initialize MathLive visually when modal opens
  useEffect(() => {
    let mf: any = null;
    if (activeModal === 'math') {
      // Need a small timeout to ensure the ref is attached to the DOM before appending
      const timer = setTimeout(() => {
        if (mathContainerRef.current) {
          import('mathlive').then(({ MathfieldElement }) => {
            if (!mathContainerRef.current) return;
            mf = new MathfieldElement();
            mf.value = mathFormula;
            
            // Match the styles of the previous textarea
            mf.style.width = '100%';
            mf.style.padding = '12px 16px';
            mf.style.borderRadius = '0.75rem';
            mf.style.border = '1px solid #e2e8f0';
            mf.style.backgroundColor = '#f8fafc';
            mf.style.outline = 'none';
            mf.style.minHeight = '84px';
            mf.style.maxHeight = '180px';
            mf.style.overflowY = 'auto';
            mf.style.fontSize = 'clamp(18px, 5vw, 24px)';
            mf.mathVirtualKeyboardPolicy = 'manual';
            
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
  }, [activeModal]);

  const execCommand = (command: string, cmdValue?: string, useSavedSelection = false) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    if (useSavedSelection && savedSelectionRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelectionRef.current);
      }
    }
    
    // Fallback: if insertHTML fails or selection is broken, try manual insert
    if (command === 'insertHTML' && useSavedSelection && savedSelectionRef.current) {
      try {
        document.execCommand(command, false, cmdValue);
      } catch(e) {
        const range = savedSelectionRef.current;
        range.deleteContents();
        const el = document.createElement('div');
        el.innerHTML = cmdValue || '';
        const frag = document.createDocumentFragment();
        let node, lastNode;
        while ((node = el.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);
        if (lastNode) {
          range.setStartAfter(lastNode);
          range.collapse(true);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }
    } else {
      document.execCommand(command, false, cmdValue);
    }
    
    handleInput(true);
  };


  const insertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const uploadedUrl = await uploadFileToServer(file);
          setImageSettings({ src: uploadedUrl, width: "100", align: "center" });
          setEditingImage(null);
          setActiveModal('image');
        } catch (error) {
          console.error("Upload failed:", error);
          alert("Failed to upload image. Please try again.");
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
      
      const imgHtml = `<img loading="lazy" decoding="async" src="${imageSettings.src}" style="width: ${imageSettings.width}%; max-width: 100%; height: auto; border-radius: 12px; margin: ${marginStyle}; display: ${displayStyle}; float: ${floatStyle};" />&nbsp;`;
      execCommand('insertHTML', imgHtml, true);
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
    handleInput(true);
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
      } else {
        setEditingImage(null);
      }
    };

    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('click', handleEditorClick);
      return () => editor.removeEventListener('click', handleEditorClick);
    }
  }, []);

  useEffect(() => {
    if (editingImage && editorRef.current) {
      const updatePosition = () => {
        const imgEl = editingImage;
        const container = editorRef.current?.parentElement;
        if (container) {
          const imgRect = imgEl.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          setImageRect({
            top: imgRect.top - containerRect.top,
            left: imgRect.left - containerRect.left,
            width: imgRect.width,
            height: imgRect.height,
          });
        }
      };

      updatePosition();
      
      window.addEventListener('resize', updatePosition);
      editorRef.current.addEventListener('scroll', updatePosition);
      
      const observer = new MutationObserver(updatePosition);
      observer.observe(editorRef.current, { attributes: true, childList: true, subtree: true });
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        editorRef.current?.removeEventListener('scroll', updatePosition);
        observer.disconnect();
      };
    } else {
      setImageRect(null);
    }
  }, [editingImage]);

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
    execCommand('insertHTML', tableHtml, true);
    setActiveModal(null);
  };

  const handleInsertMath = () => {
    if (mathFormula) {
      try {
        const renderedMath = katex.renderToString(mathFormula, { throwOnError: false });
        const mathHtml = `<span class="math-tex inline-block mx-1 align-middle" contenteditable="false" data-latex="${mathFormula.replace(/"/g, '&quot;')}">${renderedMath}</span>&nbsp;`;
        execCommand('insertHTML', mathHtml, true);
      } catch (err) {
        console.error("KaTeX rendering error", err);
        const mathHtml = `<span class="math-tex" style="font-family: 'Times New Roman', serif; font-style: italic; background: #f8fafc; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">\\( ${mathFormula} \\)</span>&nbsp;`;
        execCommand('insertHTML', mathHtml, true);
      }
    }
    setActiveModal(null);
  };

  const handleDeleteImage = () => {
    if (editingImage) {
      try {
        const range = document.createRange();
        range.selectNode(editingImage);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
        document.execCommand('delete', false);
      } catch (e) {
        editingImage.remove();
      }
      setEditingImage(null);
      setActiveModal(null);
      handleInput(true);
    }
  };

  const handleStripAllImages = () => {
    if (confirm(language === 'ar' ? "هل أنت متأكد من حذف جميع الصور من هذا النص؟" : "Are you sure you want to delete all images from this text?")) {
      if (editorRef.current) {
        const imgs = Array.from(editorRef.current.querySelectorAll('img'));
        imgs.forEach(img => img.remove());
        handleInput(true);
      }
    }
  };

  const handleInput = (immediate = false) => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      // Keep the owning form state in lockstep with the editable DOM. Delaying this
      // callback used to leave a 500 ms window where Save, reorder, modal close, or
      // navigation could serialize the previous value and permanently lose the last
      // characters the user typed.
      if (immediate || content !== value) onChange(content);
    }
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => {
    setIsFocused(false);
    handleInput(true);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    let handled = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        handled = true;
        const file = items[i].getAsFile();
        if (!file) continue;
        
        try {
          const uploadedUrl = await uploadFileToServer(file);
          execCommand('insertHTML', `<img loading="lazy" decoding="async" src="${uploadedUrl}" style="max-width: 100%; height: auto; border-radius: 12px; margin: 10px auto; display: block;" />&nbsp;`);
        } catch (err) {
          console.error("Failed to upload pasted image:", err);
        }
      }
    }

    if (!handled) {
      const htmlData = e.clipboardData.getData("text/html");
      if (htmlData) {
        if (htmlData.includes("data:image/")) {
          e.preventDefault();
          
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlData, "text/html");
          const images = Array.from(doc.querySelectorAll('img[src^="data:image/"]')) as HTMLImageElement[];
          
          if (images.length > 0) {
            // Show some visual feedback that images are processing
            const processingId = `processing-${Date.now()}`;
            execCommand('insertHTML', `<span id="${processingId}" style="color: #6366f1; font-style: italic;">${language === 'ar' ? "جاري رفع الصور..." : "Uploading images..."}</span>`);
            
            for (const img of images) {
              try {
                // Convert base64 to File
                const res = await fetch(img.src);
                const blob = await res.blob();
                const file = new File([blob], `pasted-${Date.now()}.png`, { type: blob.type });
                
                // Upload to server
                const uploadedUrl = await uploadFileToServer(file);
                img.src = uploadedUrl;
              } catch (err) {
                console.error("Failed to upload embedded image:", err);
                // Fallback: clear the src so we don't save huge base64
                img.src = "";
              }
            }
            
            // Replace processing text with actual HTML
            if (editorRef.current) {
              const processingNode = editorRef.current.querySelector(`#${processingId}`);
              if (processingNode) {
                processingNode.outerHTML = doc.body.innerHTML;
                handleInput(true);
              }
            }
          }
        } else {
          // Standard HTML Paste without images
          // Intercept to clean MS Word styles and bad math symbols!
          e.preventDefault();
          const cleanedHtml = cleanWordPaste(htmlData);
          execCommand('insertHTML', cleanedHtml);
        }
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    const items = e.dataTransfer?.items;
    if (!items) return;

    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        hasImage = true;
        break;
      }
    }

    if (hasImage) {
      e.preventDefault();
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (!file) continue;
          
          try {
            const uploadedUrl = await uploadFileToServer(file);
            execCommand('insertHTML', `<img loading="lazy" decoding="async" src="${uploadedUrl}" style="max-width: 100%; height: auto; border-radius: 12px; margin: 10px auto; display: block;" />&nbsp;`);
          } catch (err) {
            console.error("Failed to upload dropped image:", err);
          }
        }
      }
    }
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
    <div className={`w-full max-w-full flex flex-col border-2 rounded-[30px] transition-all duration-300 bg-white ${isFocused
        ? 'border-indigo-500 ring-8 ring-indigo-500/5 shadow-2xl'
        : 'border-slate-100 hover:border-slate-200 shadow-sm'
      } ${className} relative`}>

      {/* Toolbar */}
      <div className="bg-slate-50/50 backdrop-blur-md border-b border-slate-100 p-2.5 flex flex-wrap gap-1.5 items-center rounded-t-[28px]">
        <ToolButton onClick={() => execCommand('bold')} icon={Bold} title={language === 'ar' ? "عريض" : "Bold"} />
        <ToolButton onClick={() => execCommand('italic')} icon={Italic} title={language === 'ar' ? "مائل" : "Italic"} />
        <ToolButton onClick={() => execCommand('underline')} icon={Underline} title={language === 'ar' ? "تحت خط" : "Underline"} />

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <ToolButton onClick={() => execCommand('formatBlock', 'h1')} icon={Heading1} title={language === 'ar' ? "عنوان كبير" : "Heading 1"} />
        <ToolButton onClick={() => execCommand('formatBlock', 'h2')} icon={Heading2} title={language === 'ar' ? "عنوان متوسط" : "Heading 2"} />

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <select
          onChange={(e) => execCommand('fontSize', e.target.value)}
          className="bg-transparent text-xs font-bold text-slate-500 outline-none hover:text-indigo-600 cursor-pointer p-1"
          title={language === 'ar' ? "حجم الخط" : "Font Size"}
        >
          <option value="">{language === 'ar' ? "حجم الخط" : "Font Size"}</option>
          <option value="1">{language === 'ar' ? "صغير جداً" : "Very Small"}</option>
          <option value="2">{language === 'ar' ? "صغير" : "Small"}</option>
          <option value="3">{language === 'ar' ? "عادي" : "Normal"}</option>
          <option value="4">{language === 'ar' ? "متوسط" : "Medium"}</option>
          <option value="5">{language === 'ar' ? "كبير" : "Large"}</option>
          <option value="6">{language === 'ar' ? "كبير جداً" : "Very Large"}</option>
          <option value="7">{language === 'ar' ? "ضخم" : "Huge"}</option>
        </select>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <ToolButton onClick={() => execCommand('insertUnorderedList')} icon={List} title={language === 'ar' ? "نقاط" : "Bullet List"} />
        <ToolButton onClick={() => execCommand('insertOrderedList')} icon={ListOrdered} title={language === 'ar' ? "ترقيم" : "Numbered List"} />

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <ToolButton onClick={() => execCommand('justifyLeft')} icon={AlignLeft} title={language === 'ar' ? "محاذاة لليسار" : "Align Left"} />
        <ToolButton onClick={() => execCommand('justifyCenter')} icon={AlignCenter} title={language === 'ar' ? "توسيط" : "Align Center"} />
        <ToolButton onClick={() => execCommand('justifyRight')} icon={AlignRight} title={language === 'ar' ? "محاذاة لليمين" : "Align Right"} />

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <ToolButton onClick={() => { saveSelection(); insertImage(); }} icon={ImageIcon} title={language === 'ar' ? "إدراج صورة" : "Insert Image"} />
        {editingImage && (
          <ToolButton
            onClick={handleDeleteImage}
            icon={Trash2}
            title={language === 'ar' ? "حذف الصورة المحددة" : "Delete Selected Image"}
            className="text-red-500 hover:bg-red-50 hover:text-red-600 animate-in fade-in duration-200"
          />
        )}
        <ToolButton onClick={() => { saveSelection(); setActiveModal('table'); }} icon={Table} title={language === 'ar' ? "إدراج جدول" : "Insert Table"} />
        <ToolButton onClick={() => { saveSelection(); setActiveModal('math'); }} icon={Sigma} title={language === 'ar' ? "إدراج معادلة" : "Insert Math"} />
        <div className="w-px h-6 bg-slate-200 mx-1" />

        <div className="flex flex-wrap items-center justify-center gap-1.5 px-2 bg-slate-100/50 rounded-2xl py-1.5 min-w-[140px]">
          <span className="text-[9px] font-black text-slate-400 uppercase ml-1">{language === 'ar' ? "اللون:" : "Color:"}</span>
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
          onClick={() => {
             document.execCommand('backColor', false, '#fef08a') || document.execCommand('hiliteColor', false, '#fef08a');
             handleInput(true);
          }} 
          icon={Highlighter} 
          title={language === 'ar' ? "تظليل النص (أصفر)" : "Highlight"}
        />

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <ToolButton
          onClick={() => execCommand('removeFormat')}
          icon={Eraser}
          title={language === 'ar' ? "مسح التنسيق" : "Clear Format"}
          className="hover:text-red-500 hover:bg-red-50"
        />

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <ToolButton
          onClick={handleStripAllImages}
          icon={Trash2}
          title={language === 'ar' ? "حذف جميع الصور" : "Delete All Images"}
          className="hover:text-red-500 hover:bg-red-50"
        />
      </div>

      {/* Inline Modals */}
      {activeModal === 'table' && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/40 backdrop-blur-[2px] p-3 sm:p-6 overflow-y-auto custom-scrollbar" onClick={() => setActiveModal(null)}>
        <div className="relative mx-auto my-3 sm:my-8 bg-white border border-slate-200 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[320px] max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200 rtl" dir="rtl" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-black text-slate-800 flex items-center gap-2">
              <Table className="w-5 h-5 text-indigo-600" />
              {language === 'ar' ? "إدراج جدول" : "Insert Table"}
            </h4>
            <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "عدد الصفوف" : "Rows"}</label>
              <input
                type="number"
                value={tableConfig.rows}
                onChange={(e) => setTableConfig({ ...tableConfig, rows: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 font-bold"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "عدد الأعمدة" : "Columns"}</label>
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
            {language === 'ar' ? "تأكيد الإدراج" : "Confirm"}
          </button>
        </div>
        </div>
      )}

      {activeModal === 'image' && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/40 backdrop-blur-[2px] p-3 sm:p-6 overflow-y-auto custom-scrollbar" onClick={() => setActiveModal(null)}>
        <div className="relative mx-auto my-3 sm:my-8 bg-white border border-slate-200 p-4 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[380px] max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200 rtl" dir="rtl" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-indigo-600" />
            {language === 'ar' ? "إدراج صورة" : "Insert Image"}
          </h3>
            <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "العرض (%)" : "Width (%)"}</label>
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المحاذاة والالتفاف" : "Alignment"}</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'left', label: language === 'ar' ? 'يسار' : 'Left', icon: AlignLeft },
                  { id: 'center', label: language === 'ar' ? 'توسيط' : 'Center', icon: AlignCenter },
                  { id: 'right', label: language === 'ar' ? 'يمين' : 'Right', icon: AlignRight },
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
            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            {editingImage ? (language === 'ar' ? 'تحديث الإعدادات' : 'Update Settings') : (language === 'ar' ? 'إدراج الصورة' : 'Insert Image')}
          </button>

          {editingImage && (
            <button
              type="button"
              onClick={handleDeleteImage}
              className="w-full bg-red-500 text-white py-2.5 rounded-xl font-black shadow-lg shadow-red-200 hover:bg-red-600 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Trash2 className="w-4 h-4" />
              {language === 'ar' ? "حذف الصورة" : "Delete Image"}
            </button>
          )}
        </div>
        </div>
      )}
      {activeModal === 'math' && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/40 backdrop-blur-[2px] p-3 sm:p-6 overflow-y-auto custom-scrollbar" onClick={() => setActiveModal(null)}>
        <div className="relative mx-auto my-3 sm:my-8 bg-white border border-slate-200 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[400px] max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200 rtl" dir="rtl" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-black text-slate-800 flex items-center gap-2">
              <Sigma className="w-5 h-5 text-indigo-600" />
              {language === 'ar' ? "إدراج معادلة رياضية" : "Insert Math Equation"}
            </h4>
            <div className="flex items-center gap-2">
              <button 
                title={language === 'ar' ? "تبديل لوحة المفاتيح المتقدمة" : "Toggle Advanced Keyboard"}
                onClick={() => {
                  const vk = (window as any).mathVirtualKeyboard;
                  if (vk) {
                    if (vk.visible) {
                      vk.hide();
                    } else {
                      vk.show();
                    }
                  }
                }}
                className="text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded-lg transition-all flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "21px", height: "21px" }} viewBox="0 0 576 512" fill="currentColor">
                  <path d="M528 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h480c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm16 336c0 8.823-7.177 16-16 16H48c-8.823 0-16-7.177-16-16V112c0-8.823 7.177-16 16-16h480c8.823 0 16 7.177 16 16v288zM168 268v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-336 80v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm384 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zM120 188v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-96 152v-8c0-6.627-5.373-12-12-12H180c-6.627 0-12 5.373-12 12v8c0 6.627 5.373 12 12 12h216c6.627 0 12-5.373 12-12z"></path>
                </svg>
              </button>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg transition-all"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="flex flex-col gap-3 mb-6">
            {/* Custom Embedded Keypad */}
            <div className="bg-slate-100 p-2 sm:p-3 rounded-2xl shadow-inner flex flex-col gap-2">
              {/* Top Row: Arrows & Backspace */}
              <div className="flex justify-between gap-2">
                <div className="flex gap-1 sm:gap-1.5">
                  <button onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.executeCommand('moveToPreviousChar'); mf.focus(); } }} className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg shadow-sm font-bold text-base sm:text-lg hover:bg-slate-50 hover:text-indigo-600 active:scale-95 transition-all">←</button>
                  <button onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.executeCommand('moveUp'); mf.focus(); } }} className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg shadow-sm font-bold text-base sm:text-lg hover:bg-slate-50 hover:text-indigo-600 active:scale-95 transition-all">↑</button>
                  <button onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.executeCommand('moveDown'); mf.focus(); } }} className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg shadow-sm font-bold text-base sm:text-lg hover:bg-slate-50 hover:text-indigo-600 active:scale-95 transition-all">↓</button>
                  <button onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.executeCommand('moveToNextChar'); mf.focus(); } }} className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg shadow-sm font-bold text-base sm:text-lg hover:bg-slate-50 hover:text-indigo-600 active:scale-95 transition-all">→</button>
                </div>
                <button onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.executeCommand('deleteBackward'); mf.focus(); } }} className="w-14 h-8 sm:h-10 bg-red-100 text-red-600 rounded-lg shadow-sm font-bold hover:bg-red-200 active:scale-95 transition-all text-xs sm:text-sm">⌫ {language === 'ar' ? "مسح" : "Del"}</button>
              </div>
              
              {/* Middle Row: Functions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.insert('\\frac{#?}{#?}'); mf.focus(); } }} className="py-2 bg-indigo-50 text-indigo-700 rounded-lg shadow-sm font-black hover:bg-indigo-100 active:scale-95 transition-all text-xs sm:text-sm">½ {language === 'ar' ? "كسر" : "Frac"}</button>
                <button onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.insert('^{#?}'); mf.focus(); } }} className="py-2 bg-indigo-50 text-indigo-700 rounded-lg shadow-sm font-black hover:bg-indigo-100 active:scale-95 transition-all text-xs sm:text-sm">x² {language === 'ar' ? "أُس" : "Exp"}</button>
                <button onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.insert('\\sqrt{#?}'); mf.focus(); } }} className="py-2 bg-indigo-50 text-indigo-700 rounded-lg shadow-sm font-black hover:bg-indigo-100 active:scale-95 transition-all text-xs sm:text-sm">√ {language === 'ar' ? "جذر" : "Root"}</button>
                <button onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.insert('\\left(#?\\right)'); mf.focus(); } }} className="py-2 bg-indigo-50 text-indigo-700 rounded-lg shadow-sm font-black hover:bg-indigo-100 active:scale-95 transition-all text-xs sm:text-sm">( ) {language === 'ar' ? "أقواس" : "Brackets"}</button>
              </div>

              {/* Bottom Grid: Numbers & Operators */}
              <div className="grid grid-cols-4 gap-2">
                {['7', '8', '9', '+'].map(btn => (
                  <button key={btn} onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.insert(btn); mf.focus(); } }} className="py-2 sm:py-2.5 bg-white rounded-lg shadow-sm font-bold text-base sm:text-xl hover:bg-slate-50 text-slate-700 active:scale-95 transition-all">{btn}</button>
                ))}
                {['4', '5', '6', '-'].map(btn => (
                  <button key={btn} onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.insert(btn); mf.focus(); } }} className="py-2 sm:py-2.5 bg-white rounded-lg shadow-sm font-bold text-base sm:text-xl hover:bg-slate-50 text-slate-700 active:scale-95 transition-all">{btn}</button>
                ))}
                {['1', '2', '3', '*'].map(btn => (
                  <button key={btn} onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.insert(btn === '*' ? '\\cdot' : btn); mf.focus(); } }} className="py-2 sm:py-2.5 bg-white rounded-lg shadow-sm font-bold text-base sm:text-xl hover:bg-slate-50 text-slate-700 active:scale-95 transition-all">{btn === '*' ? '×' : btn}</button>
                ))}
                {['0', '.', '=', '/'].map(btn => (
                  <button key={btn} onClick={() => { const mf = mathContainerRef.current?.firstChild as any; if(mf){ mf.insert(btn === '/' ? '\\div' : btn); mf.focus(); } }} className="py-2 sm:py-2.5 bg-white rounded-lg shadow-sm font-bold text-base sm:text-xl hover:bg-slate-50 text-slate-700 active:scale-95 transition-all">{btn === '/' ? '÷' : btn}</button>
                ))}
              </div>
            </div>

            <div ref={mathContainerRef} className="w-full mt-2" dir="ltr" />
          </div>
          <button
            onClick={handleInsertMath}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
          >
            إدراج المعادلة
          </button>
        </div>
        </div>
      )}
      <div className="relative min-h-[300px] bg-white group">
        <div
          ref={editorRef}
          contentEditable
          onInput={() => handleInput(false)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onPaste={handlePaste}
          onDrop={handleDrop}
          className="p-3 md:p-6 outline-none text-lg min-h-[300px] prose prose-slate max-w-none editor-content"
          dir="auto"
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

        {imageRect && (
          <button
            type="button"
            onClick={handleDeleteImage}
            style={{
              position: 'absolute',
              top: `${imageRect.top + 8}px`,
              left: `${imageRect.left + imageRect.width - 40}px`,
              zIndex: 30,
            }}
            className="w-8 h-8 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full shadow-lg hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer transition-all duration-200 border border-white"
            title="حذف الصورة"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

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

