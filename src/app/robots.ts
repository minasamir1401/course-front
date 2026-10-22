import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/siteSeo';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/dashboard', '/courses', '/lessons', '/exams', '/activities', '/calendar', '/reports', '/assignments', '/profile', '/settings', '/login', '/super-admin', '/school-admin', '/messages', '/certificates', '/notifications', '/competitions'] },
    sitemap: new URL('/sitemap.xml', siteUrl).href,
  };
}
