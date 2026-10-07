import React from "react";
import type { Metadata } from "next";
import SchoolTeachersView from "./SchoolTeachersView";

export const metadata: Metadata = {
  title: "إدارة المعلمين | إدارة المدرسة | Klevro",
  description: "لوحة التحكم لإدارة طاقم المعلمين وصلاحياتهم في المدرسة.",
};

export default function SchoolAdminTeachersPage() {
  return <SchoolTeachersView />;
}
