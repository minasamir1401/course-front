import React from "react";
import type { Metadata } from "next";
import SettingsView from "./SettingsView";

export const metadata: Metadata = {
  title: "الإعدادات العامة | Klevro",
  description: "إعدادات الحساب والتفضيلات وتخصيص تجربة المنصة.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
