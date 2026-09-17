import React from "react";
import type { Metadata } from "next";
import SuperAdminLoginForm from "./SuperAdminLoginForm";

export const metadata: Metadata = {
  title: "تسجيل الدخول - الإدارة العامة | Klevro",
  description: "بوابة تسجيل الدخول الخاصة بمديري النظام والإدارة العليا للمنصة.",
};

export default function SuperAdminLoginPage() {
  return <SuperAdminLoginForm />;
}
