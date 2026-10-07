import React from "react";
import type { Metadata } from "next";
import ProfileView from "./ProfileView";

export const metadata: Metadata = {
  title: "الملف الشخصي | Klevro",
  description: "عرض إحصائيات ونقاط وتقدم الطالب الشخصي.",
};

export default function ProfilePage() {
  return <ProfileView />;
}
