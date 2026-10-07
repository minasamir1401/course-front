import React from "react";
import type { Metadata } from "next";
import SchoolAdminSkillsHubView from "./SchoolAdminSkillsHubView";

export const metadata: Metadata = {
  title: "المهارات التفاعلية | إدارة المدرسة | Klevro",
  description: "لوحة التحكم لإدارة المحاور المهاراتية والدروس والأنشطة التفاعلية للمدرسة.",
};

export default function SchoolAdminSkillsHubPage() {
  return <SchoolAdminSkillsHubView />;
}
