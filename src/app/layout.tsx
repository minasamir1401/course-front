import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://platform.tech'),
  title: {
    default: "Platform",
    template: "%s | Platform"
  },
  description: "Platform is the best smart educational platform for managing schools, centers, private tutoring, and exams all over the world. Enjoy a comprehensive and innovative Learning Management System (LMS).",
  keywords: [
    "platform", "educational platform", "school management", "learning management system", "LMS",
    "exams platform", "online courses", "tutoring", "student management", "interactive learning"
  ],
  authors: [{ name: "Platform Team" }],
  creator: "Platform",
  publisher: "Platform EduTech",
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
    title: "Platform - The Future of Smart Education",
    description: "Join Platform to manage your school, center, or courses with AI-powered tools and interactive assessments.",
    url: 'https://platform.tech',
    siteName: 'Platform',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Platform Logo',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Platform - The Smartest Educational Platform",
    description: "Elevate education with the Platform. Comprehensive management for schools, courses, and smart exams.",
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
