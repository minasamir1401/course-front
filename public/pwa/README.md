# Installed-app branding

The source is the supplied white-background logo at
`public/klevro/brand/klevro-logo.jpg`.

Run `node scripts/generate-app-icons.cjs` from the frontend to rebuild the PNG
and ICO assets. The maskable icon extends the artwork's background to keep the
whole logo and wordmark inside the safe area.

`src/lib/appBrand.ts`, the offline page and `sw.js` use revisioned asset URLs.
When changing the artwork, bump the revision in those references and the
generator, and increment the service worker's public offline cache version.
Keep the manifest URL, id, scope and start URL stable: this is an update to the
existing installed app. Previous icon URLs remain available to older clients
until their app metadata updates.

The manifest must revalidate, and service worker updates do not reload open
editors. The worker caches only the public offline page and its icon. Launcher
and launch-screen icon updates remain controlled by the browser/OS. Existing
iOS home-screen installations may require removing and re-adding the shortcut
after the new version is deployed. No native APK/desktop wrapper is built here.
