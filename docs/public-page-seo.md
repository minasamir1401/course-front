# Public page and SEO

Set `NEXT_PUBLIC_SITE_URL` to the real public origin before building for deployment (for example, `https://your-public-domain.example`). It is shared by canonical links, Open Graph metadata, JSON-LD, robots.txt and sitemap.xml. Without a configured origin, local development uses `http://localhost:3000`; no production domain is assumed.

Only the public home page is listed in the sitemap and explicitly indexable. Account pages inherit `noindex, nofollow` and are excluded by robots.txt. These SEO controls do not replace authentication.

The public page includes Arabic content in its server-rendered HTML, a generated 1200×630 sharing image, and Organization, WebSite and WebApplication structured data. Arabic/English interface switching uses the existing language preference. No nonexistent `/en` route, ratings, testimonials or usage counts are advertised.
