import React from "react";
import type { Metadata } from "next";
import AssignmentsView from "./AssignmentsView";

export const metadata: Metadata = {
  title: "الواجبات المدرسية | Klevro",
  description: "متابعة الواجبات المدرسية والمهام وتسليم التكليفات في المواعيد المحددة.",
};

export default function AssignmentsPage() {
  return <AssignmentsView />;
}
