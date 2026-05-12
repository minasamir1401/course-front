import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({ 
  subsets: ["arabic"],
  weight: ["200", "300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
});

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
      <body className={`${tajawal.variable} font-sans bg-[#F8FAFC] text-slate-800`}>
        <NotificationProvider>
          <ImpersonationBanner />
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
