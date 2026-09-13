'use client';

import React, { useState, useId, useMemo } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Copy,
  Check,
  Upload,
  ExternalLink,
  Trash2,
  Sparkles,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  extractImageUrls,
  insertImageIntoHtml,
  removeImageFromHtml,
  uploadFileToServer
} from '@/lib/image-utils';

interface QuestionImageGalleryProps {
  language: string;
  activeLang: 'ar' | 'en';
  tempQuestion: Record<string, any>;
  allQuestions?: any[];
  onUpdateQuestion: (field: string, value: any) => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  textField?: string;
  textFieldEn?: string;
  imageField?: string;
  title?: string;
}

export default function QuestionImageGallery({
  language,
  activeLang,
  tempQuestion,
  allQuestions = [],
  onUpdateQuestion,
  showToast = () => {},
  textField,
  textFieldEn,
  imageField,
  title
}: QuestionImageGalleryProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputId = useId();

  const isArUi = language === 'ar';
  const isEnActive = activeLang === 'en';

  const resolvedTextField = textField || (
    'questionText' in tempQuestion ? 'questionText' :
    'content' in tempQuestion ? 'content' :
    'prompt' in tempQuestion ? 'prompt' : 'text'
  );
  const resolvedTextFieldEn = textFieldEn || (
    'questionTextEn' in tempQuestion ? 'questionTextEn' :
    'contentEn' in tempQuestion ? 'contentEn' :
    'promptEn' in tempQuestion ? 'promptEn' : 'textEn'
  );
  const resolvedImageField = imageField || (
    'image' in tempQuestion ? 'image' : 'imageUrl'
  );

  const rawTextAr = tempQuestion[resolvedTextField];
  const rawTextEn = tempQuestion[resolvedTextFieldEn];
  const rawMainImage = tempQuestion[resolvedImageField];

  const arImages = useMemo(() => extractImageUrls(rawTextAr), [rawTextAr]);
  const enImages = useMemo(() => extractImageUrls(rawTextEn), [rawTextEn]);
  const mainImage = useMemo(() => (rawMainImage ? [String(rawMainImage).trim()] : []), [rawMainImage]);

  const optionsImages = useMemo(() => [
    ...extractImageUrls(typeof tempQuestion.options === 'string' ? tempQuestion.options : JSON.stringify(tempQuestion.options || '')),
    ...extractImageUrls(typeof tempQuestion.optionsEn === 'string' ? tempQuestion.optionsEn : JSON.stringify(tempQuestion.optionsEn || '')),
    ...extractImageUrls(tempQuestion.explanation || ''),
    ...extractImageUrls(tempQuestion.explanationEn || '')
  ], [tempQuestion.options, tempQuestion.optionsEn, tempQuestion.explanation, tempQuestion.explanationEn]);

  const sectionImages = useMemo(() => (tempQuestion.sections || []).flatMap((s: any) => [
    ...extractImageUrls(s.content),
    ...extractImageUrls(s.contentEn)
  ]), [tempQuestion.sections]);

  const otherQuestionsImages = useMemo(() => {
    if (!isExpanded || !allQuestions || allQuestions.length === 0) return [];
    return allQuestions
      .filter(q => q && q.id !== tempQuestion.id)
      .flatMap(q => [
        ...extractImageUrls(q.text || q.questionText || q.content || q.prompt),
        ...extractImageUrls(q.textEn || q.questionTextEn || q.contentEn || q.promptEn),
        ...(q.imageUrl ? [String(q.imageUrl).trim()] : []),
        ...(q.image ? [String(q.image).trim()] : [])
      ]);
  }, [allQuestions, tempQuestion.id, isExpanded]);

  const allDetectedUrls = useMemo(() => Array.from(
    new Set([
      ...arImages,
      ...enImages,
      ...mainImage,
      ...optionsImages,
      ...sectionImages,
      ...otherQuestionsImages
    ])
  ).filter(url => Boolean(url && url.length > 3)), [arImages, enImages, mainImage, optionsImages, sectionImages, otherQuestionsImages]);

  const missingFromActive = useMemo(() => isEnActive
    ? arImages.filter(url => !enImages.includes(url))
    : enImages.filter(url => !arImages.includes(url)), [isEnActive, arImages, enImages]);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    showToast(isArUi ? 'تم نسخ رابط الصورة' : 'Image URL copied', 'success');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleInsertIntoActive = (url: string) => {
    const field = isEnActive ? resolvedTextFieldEn : resolvedTextField;
    const currentHtml = tempQuestion[field] || '';
    const updatedHtml = insertImageIntoHtml(currentHtml, url);
    onUpdateQuestion(field, updatedHtml);

    if (isEnActive && !tempQuestion[resolvedTextField]) {
      onUpdateQuestion(resolvedTextField, updatedHtml);
    }

    showToast(
      isArUi
        ? isEnActive ? 'تم استدعاء الصورة وإدراجها في نص السؤال الإنجليزي' : 'تم استدعاء الصورة وإدراجها في نص السؤال العربي'
        : isEnActive ? 'Image inserted into English prompt' : 'Image inserted into Arabic prompt',
      'success'
    );
  };

  const handleRemoveFromActive = (url: string) => {
    const field = isEnActive ? resolvedTextFieldEn : resolvedTextField;
    const currentHtml = tempQuestion[field] || '';
    const updatedHtml = removeImageFromHtml(currentHtml, url);
    onUpdateQuestion(field, updatedHtml);

    showToast(
      isArUi
        ? isEnActive ? 'تم إزالة الصورة من النص الإنجليزي' : 'تم إزالة الصورة من النص العربي'
        : isEnActive ? 'Image removed from English prompt' : 'Image removed from Arabic prompt',
      'info'
    );
  };

  const handleSetAsMainImage = (url: string) => {
    onUpdateQuestion(resolvedImageField, url);
    showToast(
      resolvedTextField === 'content'
        ? (isArUi ? 'تم تعيين الصورة كصورة رئيسية للشريحة' : 'Image set as slide image')
        : (isArUi ? 'تم تعيين الصورة كصورة رئيسية للسؤال' : 'Image set as question illustrative image'),
      'success'
    );
  };

  const handleImportAllMissing = () => {
    if (missingFromActive.length === 0) return;
    const targetField = isEnActive ? resolvedTextFieldEn : resolvedTextField;
    let currentHtml = tempQuestion[targetField] || '';

    for (const url of missingFromActive) {
      currentHtml = insertImageIntoHtml(currentHtml, url);
    }

    onUpdateQuestion(targetField, currentHtml);
    showToast(
      isArUi
        ? `تم استدعاء ${missingFromActive.length} صورة إلى النسخة ${isEnActive ? 'الإنجليزية' : 'العربية'} بنجاح`
        : `Successfully imported ${missingFromActive.length} image(s) to ${isEnActive ? 'English' : 'Arabic'} version`,
      'success'
    );
  };

  const handleUploadNew = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadFileToServer(file);
      handleInsertIntoActive(url);
    } catch (err: any) {
      console.error(err);
      showToast(isArUi ? 'فشل رفع الصورة' : 'Failed to upload image', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-black text-slate-800 flex items-center gap-2">
              <span>
                {title || (resolvedTextField === 'content'
                  ? (isArUi ? 'معرض صور الشريحة واستدعاء الوسائط' : 'Slide Images & Media Tray')
                  : (isArUi ? 'معرض صور السؤال واستدعاء الوسائط' : 'Question Images & Media Tray'))}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                {allDetectedUrls.length} {isArUi ? 'صورة' : 'images'}
              </span>
            </h5>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">
              {isArUi
                ? 'أي صورة ترفعها في العربي أو الإنجليزي تظهر هنا فوراً لاستدعائها وإدراجها بنقرة واحدة في النسخة المقابلة.'
                : 'Images uploaded in either language appear here to insert into the counterpart language with one click.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {missingFromActive.length > 0 && (
            <button
              type="button"
              onClick={handleImportAllMissing}
              className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              title={isArUi ? 'استدعاء كافة صور النسخة الأخرى دفعة واحدة' : 'Import all counterpart images at once'}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>
                {isArUi
                  ? isEnActive
                    ? `استدعاء صور العربي إلى الإنجليزي (${missingFromActive.length})`
                    : `استدعاء صور الإنجليزي إلى العربي (${missingFromActive.length})`
                  : isEnActive
                    ? `Import Arabic Images to English (${missingFromActive.length})`
                    : `Import English Images to Arabic (${missingFromActive.length})`}
              </span>
            </button>
          )}

          <label
            htmlFor={fileInputId}
            className="px-3 py-1.5 rounded-xl text-xs font-black bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isUploading ? (isArUi ? 'جارٍ الرفع...' : 'Uploading...') : (isArUi ? 'رفع صورة جديدة' : 'Upload Image')}</span>
            <input
              id={fileInputId}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploading}
              onChange={handleUploadNew}
            />
          </label>
        </div>
      </div>

      {allDetectedUrls.length === 0 ? (
        !isExpanded ? (
          <div className="py-2.5 px-3.5 bg-white/80 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs text-slate-500 font-bold">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-[11px]">
                {resolvedTextField === 'content'
                  ? (isArUi ? 'لا توجد صور في هذه الشريحة حالياً.' : 'No images in this slide yet.')
                  : (isArUi ? 'لا توجد صور في هذا السؤال حالياً.' : 'No images in this question yet.')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-black cursor-pointer flex items-center gap-1"
            >
              <span>{isArUi ? 'عرض التفاصيل' : 'Details'}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="py-4 px-4 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center gap-2 bg-white/60">
            <div className="flex justify-between w-full items-center mb-1">
              <span />
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title={isArUi ? 'تصغير' : 'Collapse'}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
            <ImageIcon className="w-7 h-7 text-slate-300" />
            <p className="text-xs font-bold text-slate-500">
              {resolvedTextField === 'content'
                ? (isArUi
                    ? 'لم يتم رفع صور في هذه الشريحة بعد. ارفع صورة وسيقوم النظام بإتاحتها للاستدعاء الفوري في العربي والإنجليزي.'
                    : 'No images detected in this slide yet. Upload an image to make it available in both Arabic and English.')
                : (isArUi
                    ? 'لم يتم رفع صور في هذا السؤال بعد. ارفع صورة وسيقوم النظام بإتاحتها للاستدعاء الفوري في العربي والإنجليزي.'
                    : 'No images detected in this question yet. Upload an image to make it available in both Arabic and English.')}
            </p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allDetectedUrls.map((url, idx) => {
            const inAr = arImages.includes(url);
            const inEn = enImages.includes(url);
            const isMain = (tempQuestion[resolvedImageField] === url) || (tempQuestion.imageUrl === url) || (tempQuestion.image === url);
            const isInActive = isEnActive ? inEn : inAr;

            return (
              <div
                key={`${url}-${idx}`}
                className={`flex flex-col bg-white border rounded-2xl p-2.5 transition-all shadow-sm group hover:shadow-md ${
                  isInActive ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="relative w-full h-32 bg-slate-100 rounded-xl overflow-hidden mb-2 border border-slate-100 flex items-center justify-center">
                  <img
                    src={url}
                    alt="Detected media"
                    className="w-full h-full object-contain p-1"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewImage(url)}
                    className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                    title={isArUi ? 'معاينة بالحجم الكامل' : 'Preview full size'}
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {inAr && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      {isArUi ? 'بالعربي' : 'In Arabic'}
                    </span>
                  )}
                  {inEn && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                      {isArUi ? 'بالإنجليزي' : 'In English'}
                    </span>
                  )}
                  {isMain && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                      {isArUi ? 'صورة توضيحية' : 'Illustrative'}
                    </span>
                  )}
                  {isInActive && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {isArUi ? 'مدرجة حالياً' : 'In Active Prompt'}
                    </span>
                  )}
                </div>

                <div className="mt-auto flex flex-col gap-1.5 pt-1 border-t border-slate-100">
                  {isInActive ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleInsertIntoActive(url)}
                        className="flex-1 py-1 px-2 rounded-lg text-[10px] font-black bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title={isArUi ? 'إدراج نسخة إضافية في النص' : 'Insert another copy'}
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isArUi ? 'إدراج مجدداً' : 'Insert again'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromActive(url)}
                        className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title={isArUi ? 'إزالة من النص الحالي' : 'Remove from active text'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleInsertIntoActive(url)}
                      className="w-full py-1.5 px-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>
                        {isArUi
                          ? isEnActive ? 'استدعاء في الإنجليزي' : 'استدعاء في العربي'
                          : isEnActive ? 'Insert into English' : 'Insert into Arabic'}
                      </span>
                    </button>
                  )}

                  <div className="flex items-center gap-1">
                    {!isMain && (
                      <button
                        type="button"
                        onClick={() => handleSetAsMainImage(url)}
                        className="flex-1 py-1 px-1.5 rounded-lg text-[9.5px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors truncate cursor-pointer text-center"
                        title={resolvedTextField === 'content'
                          ? (isArUi ? 'تعيين كصورة توضيحية للشريحة' : 'Set as slide image')
                          : (isArUi ? 'تعيين كصورة توضيحية للسؤال' : 'Set as illustrative question image')}
                      >
                        {resolvedTextField === 'content'
                          ? (isArUi ? 'تعيين كصورة الشريحة' : 'Set as Slide Image')
                          : (isArUi ? 'تعيين كصورة السؤال' : 'Set as Question Image')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(url)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title={isArUi ? 'نسخ الرابط' : 'Copy link'}
                    >
                      {copiedUrl === url ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative bg-white rounded-2xl p-2 max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <img src={previewImage} alt="Full preview" className="max-h-[75vh] object-contain rounded-xl" />
            <div className="w-full flex items-center justify-between pt-2 px-2 text-xs font-bold text-slate-600">
              <span className="truncate max-w-md">{previewImage}</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
              >
                {isArUi ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
