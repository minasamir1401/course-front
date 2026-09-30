import React from "react";
import type { Metadata } from "next";
import SchoolAdminLoginForm from "./SchoolAdminLoginForm";

export const metadata: Metadata = {
  title: "تسجيل الدخول - إدارة المدرسة والمعلمون | Klevro",
  description: "بوابة تسجيل الدخول الخاصة بمديري المدارس والمعلمين لإدارة المقررات والاختبارات والطلاب.",
};

export default function SchoolAdminLoginPage() {
  return <SchoolAdminLoginForm />;
}
