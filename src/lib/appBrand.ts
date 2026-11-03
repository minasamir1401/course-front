// Bump the asset revision when the installed-app artwork changes. Keep the
// manifest id and URL stable so browsers update the existing installation.
export const appBrand = {
  icon192: '/pwa/klevro-v3-192.png',
  icon512: '/pwa/klevro-v3-512.png',
  maskable512: '/pwa/klevro-v3-maskable-512.png',
  apple180: '/pwa/klevro-v3-apple-180.png',
  favicon: '/pwa/klevro-v3.ico',
} as const;
