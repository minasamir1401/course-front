"use client";

import React, { useRef, useState, useCallback } from "react";
import { Upload, X, FileText, Image, Film, FileArchive, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";

interface FileUploadProps {
  /** Called with the uploaded file's remote URL once the upload succeeds */
  onUploadSuccess: (url: string) => void;
  /** Accepted MIME types, e.g. "image/*" or "application/pdf,image/*" */
  accept?: string;
  /** Label shown above the dropzone */
  label?: string;
  /** Initial value (already-uploaded URL) */
  value?: string;
  /** Token to use for auth header (defaults to super_admin_token → lms_token fallback) */
  tokenKey?: "super_admin_token" | "lms_token" | "school_admin_token";
  /** Extra class on the outer wrapper */
  className?: string;
}

type UploadState = "idle" | "uploading" | "success" | "queued" | "error";

function getMimeIcon(mime: string) {
  if (mime.startsWith("image/")) return Image;
  if (mime.startsWith("video/")) return Film;
  if (mime.includes("zip") || mime.includes("archive")) return FileArchive;
  return FileText;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Returns the direct backend base URL (without /api suffix).
 * For file uploads we bypass the Next.js proxy to avoid multipart issues.
 * Priority: NEXT_PUBLIC_BACKEND_ORIGIN env → /api fallback (proxy)
 */
function getUploadEndpoint(): string {
  // NEXT_PUBLIC_ vars are inlined at build time
  const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.replace(/\/+$/, "").trim();
  if (backendOrigin) return `${backendOrigin}/api/upload`;
  // Fallback: route through Next.js proxy (works locally)
  return "/api/upload";
}

export default function FileUpload({
  onUploadSuccess,
  accept = "image/*,application/pdf,.pptx,.ppt,.docx,.doc,.zip,.xlsx",
  label,
  value,
  tokenKey = "super_admin_token",
  className = "",
}: FileUploadProps) {
  const { t, language } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>(value ? "success" : "idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string>(value || "");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const [fileMime, setFileMime] = useState<string>("");

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/") || file.type.includes("svg") || file.type.includes("gif")) {
        return resolve(file);
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(file);
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const newName = file.name.replace(/\.[^/.]+$/, ".webp");
                resolve(new File([blob], newName, { type: "image/webp", lastModified: Date.now() }));
              } else {
                resolve(file);
              }
            },
            "image/webp",
            0.8
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const uploadFile = useCallback(
    async (rawFile: File) => {
      setUploadState("uploading");
      setProgress(0);
      setErrorMsg("");
      
      // Compress file if it's an image
      const file = await compressImage(rawFile);
      
      setFileName(file.name);
      setFileSize(formatBytes(file.size));
      setFileMime(file.type);

      // Keep an image payload locally so a server outage cannot discard it.
      let localImageDataUrl = "";
      if (file.type.startsWith("image/")) {
        localImageDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(String(event.target?.result || ""));
          reader.onerror = () => resolve("");
          reader.readAsDataURL(file);
        });
        setPreviewUrl(localImageDataUrl);
      } else {
        setPreviewUrl("");
      }

      const queueImageForSync = () => {
        if (!localImageDataUrl) return false;
        setUploadState("queued");
        setProgress(100);
        setPreviewUrl(localImageDataUrl);
        onUploadSuccess(localImageDataUrl);
        return true;
      };

      const token =
        localStorage.getItem(tokenKey) ||
        localStorage.getItem("lms_token") ||
        "";

      const formData = new FormData();
      formData.append("file", file);

      const uploadUrl = getUploadEndpoint();

      // Use XMLHttpRequest so we can track upload progress
      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            setUploadState("success");
            setProgress(100);
            if (data.url) {
              setPreviewUrl(data.url);
              onUploadSuccess(data.url);
            }
          } catch {
            setUploadState("error");
            setErrorMsg("Invalid server response");
          }
        } else {
          if (xhr.status >= 500 && queueImageForSync()) return;
          setUploadState("error");
          try {
            const data = JSON.parse(xhr.responseText);
            setErrorMsg(data.error || "Upload failed");
          } catch {
            setErrorMsg("Upload failed");
          }
        }
      };

      xhr.onerror = () => {
        if (queueImageForSync()) return;
        setUploadState("error");
        setErrorMsg("Network error. Check your connection.");
      };

      xhr.send(formData);
    },
    [onUploadSuccess, tokenKey]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleRemove = () => {
    setUploadState("idle");
    setPreviewUrl("");
    setFileName("");
    setFileSize("");
    setProgress(0);
    setErrorMsg("");
    onUploadSuccess("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const FileIcon = fileMime ? getMimeIcon(fileMime) : Upload;

  return (
    <div className={`w-full space-y-3 ${className}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {label && (
        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">
          {label}
        </label>
      )}

      {/* Dropzone */}
      {uploadState === "idle" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 group
            ${isDragging
              ? "border-indigo-500 bg-indigo-50 scale-[1.01] shadow-lg shadow-indigo-200"
              : "border-slate-200 bg-slate-50/60 hover:border-indigo-400 hover:bg-indigo-50/40"
            }`}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm
            ${isDragging ? "bg-indigo-600 text-white scale-110" : "bg-white text-slate-400 border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105"}`}>
            <Upload className="w-6 h-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-slate-700 group-hover:text-indigo-600 transition-colors">
              {t('superAdmin.fileUpload.dropzone')}
            </p>
            <p className="text-[10px] font-bold text-slate-400 mt-1">
              {t('superAdmin.fileUpload.allowedTypes')} · {t('superAdmin.fileUpload.maxSize')}
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Uploading State */}
      {uploadState === "uploading" && (
        <div className="border border-indigo-200 bg-indigo-50 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <FileIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900 truncate">{fileName}</p>
              <p className="text-[10px] text-slate-500 font-bold">{fileSize}</p>
            </div>
            <div className="flex items-center gap-2 text-indigo-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs font-black">{progress}%</span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-indigo-600 font-bold text-center">{t('superAdmin.fileUpload.uploading')}</p>
        </div>
      )}

      {/* Success State */}
      {(uploadState === "success" || uploadState === "queued") && (
        <div className={`rounded-2xl p-4 flex items-center gap-4 border ${uploadState === "queued" ? "border-amber-200 bg-amber-50/60" : "border-emerald-200 bg-emerald-50/60"}`}>
          {/* Image preview or icon */}
          {previewUrl && (fileMime.startsWith("image/") || previewUrl.match(/\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i)) ? (
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-emerald-200 shrink-0 shadow-sm">
              <img loading="lazy" decoding="async" src={previewUrl} alt="preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
              <FileIcon className="w-7 h-7 text-emerald-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${uploadState === "queued" ? "text-amber-600" : "text-emerald-600"}`} />
              <p className={`text-xs font-black ${uploadState === "queued" ? "text-amber-700" : "text-emerald-700"}`}>
                {uploadState === "queued"
                  ? (language === "ar" ? "محفوظ محلياً وسيُرفع تلقائياً" : "Saved locally and will upload automatically")
                  : t('superAdmin.fileUpload.uploaded')}
              </p>
            </div>
            {fileName && <p className="text-sm font-bold text-slate-700 truncate">{fileName}</p>}
            {fileSize && <p className="text-[10px] text-slate-500 font-bold">{fileSize}</p>}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all shrink-0"
            title={t('superAdmin.fileUpload.remove')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error State */}
      {uploadState === "error" && (
        <div className="border border-red-200 bg-red-50 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-red-700">{t('superAdmin.fileUpload.error')}</p>
              {errorMsg && <p className="text-[10px] text-red-500 font-bold mt-0.5">{errorMsg}</p>}
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => { setUploadState("idle"); setErrorMsg(""); }}
            className="w-full py-2 rounded-xl border border-red-200 text-red-600 text-xs font-black hover:bg-red-100 transition-all"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

