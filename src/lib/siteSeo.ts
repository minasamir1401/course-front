/** Set NEXT_PUBLIC_SITE_URL to the public origin when deploying. Never invent a production domain. */
function publicOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return new URL('http://localhost:3000');
  const url = new URL(configured);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('NEXT_PUBLIC_SITE_URL must be an http(s) URL');
  return new URL(url.origin);
}
export const siteUrl = publicOrigin();
export const landingDescription = 'تعلّم بوضوح وتقدّم بثقة مع Klevro. مقررات ودروس، اختبارات وتقييمات، أنشطة تفاعلية، تقويم دراسي وتقارير تقدم في منصة واحدة بالعربية والإنجليزية.';
