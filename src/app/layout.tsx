import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Klevro - منصة التعليم الذكية",
  description: "منصة تعليمية متكاملة لإدارة المدارس والدروس والامتحانات",
};

import { NotificationProvider } from "@/context/NotificationContext";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import { LanguageProvider } from "@/contexts/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans bg-[#F8FAFC] text-slate-800">
        <LanguageProvider>
          <NotificationProvider>
            <ImpersonationBanner />
            {children}
          </NotificationProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
