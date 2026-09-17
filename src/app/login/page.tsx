import React from "react";
import type { Metadata } from "next";
import StudentLoginForm from "./StudentLoginForm";

export const metadata: Metadata = {
  title: "تسجيل الدخول | Klevro",
  description: "تسجيل الدخول للطلاب والمعلمين للوصول إلى الحساب والاختبارات والمواد الدراسية.",
};

export default function LoginPage() {
  return <StudentLoginForm />;
}
