import type { Metadata, Viewport } from "next";
import { siteUrl } from "@/lib/siteSeo";
import "./globals.css";
import "./student.css";
import "katex/dist/katex.min.css";
import InstallApp from '@/components/platform/InstallApp';

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: 'Klevro | مساحة التعلم والتقييم', template: '%s | Klevro' },
  description: 'Klevro يجمع مقررات المدرسة والدروس والتقييمات والأنشطة وتقارير التقدم في مساحة تعليمية واحدة.',
  applicationName: 'Klevro', creator: 'Klevro', publisher: 'Klevro', category: 'education',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Klevro' },
  formatDetection: { email: false, address: false, telephone: false },
  other: { google: 'notranslate' },
  robots: { index: false, follow: false },
  icons: { icon: '/logo.jpeg', shortcut: '/pwa/icon-192.png', apple: '/pwa/apple-180.png' },
  verification: { google: 'MflyIkcGh9qSgjG20hEVvldZM3whuI_2adk1pL16v7Y' },
};

export const viewport: Viewport = { themeColor: '#5028E8', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

import { NotificationProvider } from "@/context/NotificationContext";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import { LanguageProvider } from "@/contexts/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" translate="no" className="notranslate">
      <head>
        <meta name="google" content="notranslate" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" />
      </head>
      {/* Browser integrations may inject body attributes (e.g. location) before hydration. */}
      <body className="font-sans bg-[#F8FAFC] text-slate-800 notranslate" translate="no" suppressHydrationWarning>
        <LanguageProvider>
          <NotificationProvider>
            <ImpersonationBanner />
            {children}
            <InstallApp />
          </NotificationProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
