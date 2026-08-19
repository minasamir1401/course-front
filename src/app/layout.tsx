import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://klevro.tech'),
  title: {
    default: "Klevro - The Smartest Educational Platform Worldwide",
    template: "%s | Klevro"
  },
  description: "Klevro is the best smart educational platform for managing schools, centers, private tutoring, and exams all over the world. Enjoy a comprehensive and innovative Learning Management System (LMS).",
  keywords: [
    "klevro", "Klevro", "educational platform", "school management", "learning management system", "LMS",
    "private tutoring", "centers platform", "online exams", "global educational platform",
    "Smart Education", "E-learning platform", "global e-learning",
    "school management system", "teacher platform", "education development"
  ],
  authors: [{ name: "Klevro Team" }],
  creator: "Klevro",
  publisher: "Klevro EduTech",
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
    title: "Klevro - The Future of Smart Education",
    description: "The most powerful Learning Management System (LMS) for schools and teachers worldwide. Join thousands of students and teachers globally.",
    url: 'https://klevro.tech',
    siteName: 'Klevro',
    images: [
      {
        url: '/logo.jpeg',
        width: 1200,
        height: 1200,
        alt: 'Klevro Logo',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Klevro - The Smartest Educational Platform",
    description: "Elevate education with the Klevro platform. Comprehensive management for schools, courses, and smart exams.",
    images: ['/logo.jpeg'],
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
