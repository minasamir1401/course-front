import type { Metadata } from 'next';
import LandingContent from '@/components/student/LandingContent';
import { siteUrl, landingDescription } from '@/lib/siteSeo';
const title = 'Klevro | منصة التعلم والاختبارات والمهارات';
export const metadata: Metadata = {
  title: { absolute: title }, description: landingDescription,
  keywords: ['Klevro', 'منصة تعليمية', 'مقررات دراسية', 'اختبارات إلكترونية', 'أنشطة تفاعلية', 'تقارير تقدم الطلاب', 'school learning platform', 'interactive learning', 'online assessments'],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  openGraph: { title, description: landingDescription, url: '/', siteName: 'Klevro', locale: 'ar_EG', alternateLocale: ['en_GB'], type: 'website', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Klevro — Learn with clarity. Grow with confidence.' }] },
  twitter: { card: 'summary_large_image', title, description: landingDescription, images: ['/opengraph-image'] },
};
export default function LandingPage() {
  const structuredData = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Organization', '@id': new URL('/#organization', siteUrl).href, name: 'Klevro', url: siteUrl.href, logo: new URL('/logo.jpeg', siteUrl).href },
    { '@type': 'WebSite', name: 'Klevro', url: siteUrl.href, description: landingDescription, inLanguage: ['ar', 'en'], publisher: { '@id': new URL('/#organization', siteUrl).href } },
    { '@type': 'WebApplication', name: 'Klevro', url: siteUrl.href, applicationCategory: 'EducationalApplication', operatingSystem: 'Web browser', inLanguage: ['ar', 'en'], description: landingDescription, featureList: ['School courses and lessons', 'Online assessments', 'Interactive activities', 'Academic calendar', 'Progress reports'] },
  ] };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} /><LandingContent /></>;
}
