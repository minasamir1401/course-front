import React from "react";
import type { Metadata } from "next";
import MessagesView from "./MessagesView";

export const metadata: Metadata = {
  title: "الرسائل والمحادثات | Klevro",
  description: "مركز الرسائل والتواصل المباشر مع المعلمين والزملاء.",
};

export default function MessagesPage() {
  return <MessagesView />;
}
