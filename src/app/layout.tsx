import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "منصتي - منصة التعليم الذكية",
  description: "منصة تعليمية متكاملة لإدارة المدارس والدروس والامتحانات",
};

import { NotificationProvider } from "@/context/NotificationContext";
import ImpersonationBanner from "@/components/ImpersonationBanner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans bg-[#F8FAFC] text-slate-800">
        <NotificationProvider>
          <ImpersonationBanner />
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
