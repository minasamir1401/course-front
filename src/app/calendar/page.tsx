import React from "react";
import type { Metadata } from "next";
import CalendarClient from "./CalendarClient";

export const metadata: Metadata = {
  title: "التقويم الدراسي | Klevro",
  description: "التقويم الدراسي والجدول الزمني للاختبارات والمحاضرات.",
};

export default function CalendarPage() {
  return <CalendarClient />;
}
