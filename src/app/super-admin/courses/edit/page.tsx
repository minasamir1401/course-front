"use client";

import React, { Suspense } from "react";
import CourseEditor from "@/components/course-editor/CourseEditor";

export default function EditCoursePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <CourseEditor role="SUPER_ADMIN" />
    </Suspense>
  );
}
