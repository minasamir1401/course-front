import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/', name: 'Klevro — منصة التعلّم', short_name: 'Klevro',
    description: 'دروسك ومقرراتك وامتحاناتك وشهاداتك في مكان واحد. Your learning space, everywhere.',
    lang: 'ar', dir: 'rtl', start_url: '/dashboard', scope: '/', display: 'standalone',
    background_color: '#F4F7FC', theme_color: '#5028E8', categories: ['education'],
    icons: [
      { src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
