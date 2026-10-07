import React from "react";
import type { Metadata } from "next";
import ExamsListView from "./ExamsListView";

export const metadata: Metadata = {
  title: "الاختبارات المدرسية | Klevro",
  description: "استعراض وحل الاختبارات المدرسية والتقييمات ومتابعة الإنجازات.",
};

export default function ExamsPage() {
  return <ExamsListView />;
}
