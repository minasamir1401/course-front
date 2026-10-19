import type { Metadata } from "next";
import "./globals.css";
import "./student.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://platform.tech'),
  other: {
    google: 'notranslate',
  },
  title: {
    default: "Klevro",
    template: "%s | Klevro"
  },
  description: "Klevro brings your school courses, lessons, exams and progress together.",
  keywords: [
    "platform", "educational platform", "school management", "learning management system", "LMS",
    "exams platform", "online courses", "tutoring", "student management", "interactive learning"
  ],
  authors: [{ name: "Klevro Team" }],
  creator: "Platform",
  publisher: "Klevro",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en',
    },
  },
  openGraph: {
    title: "Klevro - Your learning space",
    description: "Follow your school courses, lessons, exams and progress in Klevro.",
    url: 'https://platform.tech',
    siteName: 'Klevro',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Klevro Logo',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Klevro - Learning & assessment",
    description: "Your school courses, interactive learning and assessments in Klevro.",
    images: ['/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/logo.jpeg',
    shortcut: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
  verification: {
    google: 'MflyIkcGh9qSgjG20hEVvldZM3whuI_2adk1pL16v7Y',
  },
  category: 'education',
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
          </NotificationProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
