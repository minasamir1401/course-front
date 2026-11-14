"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Trash2, Upload } from "lucide-react";
import { getFullImageUrl } from "@/lib/api";
import { shouldSkipImageOptimization } from "@/lib/imageDisplay";

interface CourseCoverUploadFieldProps {
  coverImage: string;
  language: string;
  onChange: (nextUrl: string) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  label?: string;
}

export const CourseCoverUploadField: React.FC<CourseCoverUploadFieldProps> = ({
  coverImage,
  language,
  onChange,
  showToast,
  label,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { uploadFileToServer } = await import("@/lib/image-utils");
      const url = await uploadFileToServer(file);
      onChange(url);
      showToast(
        language === "ar" ? "تم رفع صورة الغلاف بنجاح" : "Cover image uploaded successfully",
        "success",
      );
    } catch (error: any) {
      showToast(
        error?.message ||
          (language === "ar" ? "فشل رفع الصورة، حاول مرة أخرى" : "Failed to upload image, please try again"),
        "error",
      );
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">
        {label || (language === "ar" ? "صورة الغلاف" : "Cover Image")}
      </label>
      {coverImage ? (
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-slate-100 group">
          <Image
            src={getFullImageUrl(coverImage) || "/klevro/brand/klevro-logo.jpg"}
            alt="Course Cover"
            fill
            className="object-cover"
            unoptimized={shouldSkipImageOptimization(getFullImageUrl(coverImage) || "/klevro/brand/klevro-logo.jpg")}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3 z-10">
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-2.5 bg-red-500 text-white rounded-xl hover:scale-105 transition-all"
              aria-label={language === "ar" ? "إزالة الغلاف" : "Remove cover"}
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <label className="p-2.5 bg-indigo-600 text-white rounded-xl hover:scale-105 transition-all cursor-pointer">
              <Upload className="w-5 h-5" />
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center aspect-video w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all group cursor-pointer">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <span className="text-xs font-black text-slate-500 group-hover:text-indigo-600">
            {isUploading
              ? language === "ar"
                ? "جاري رفع الغلاف..."
                : "Uploading cover..."
              : language === "ar"
                ? "اضغط لرفع غلاف الكورس"
                : "Click to upload course cover"}
          </span>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
        </label>
      )}
    </div>
  );
};
