import React from "react";
import type { Metadata } from "next";
import SchoolCoursesView from "./SchoolCoursesView";

export const metadata: Metadata = {
  title: "إدارة الكورسات | إدارة المدرسة | Klevro",
  description: "لوحة التحكم لإدارة المناهج والكورسات الدراسية بالمدرسة.",
};

export default function SchoolAdminCoursesPage() {
  return <SchoolCoursesView />;
}
