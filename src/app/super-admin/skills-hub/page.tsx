import React from "react";
import type { Metadata } from "next";
import SuperAdminSkillsHubView from "./SuperAdminSkillsHubView";

export const metadata: Metadata = {
  title: "المهارات التفاعلية | الإدارة العامة | Klevro",
  description: "لوحة التحكم لإدارة المحاور المهاراتية والدروس والأنشطة التفاعلية بالمنصة.",
};

export default function SuperAdminSkillsHubPage() {
  return <SuperAdminSkillsHubView />;
}
