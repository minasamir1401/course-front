import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/siteSeo';
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: new URL('/', siteUrl).href, changeFrequency: 'monthly', priority: 1 }];
}
