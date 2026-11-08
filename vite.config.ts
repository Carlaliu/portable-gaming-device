import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Static build for Vercel (or any static host). The PWA plugin precaches every built file with a
// content hash, so each deploy is a new offline version without hand-editing a service worker.
export default defineConfig({
  base: './',
  build: { target: 'es2022', assetsInlineLimit: 0 },
  plugins: [
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'favicon.ico', 'icons/*.png', 'og-image.png'],
      manifest: MANIFEST(),
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [{
          urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
          handler: 'CacheFirst',
          options: { cacheName: 'gg-fonts', expiration: { maxEntries: 30, maxAgeSeconds: 31536000 }, cacheableResponse: { statuses: [0, 200] } },
        }],
      },
    }),
  ],
});

function MANIFEST(): any {
  return {
    "name": "Game Guy 3000 Deluxe",
    "short_name": "Game Guy",
    "description": "A 1983-style home console on a glowing phosphor monitor: pick a floppy and play Tunnel Raider or Dino Run. Plays offline.",
    "id": "./",
    "start_url": "./",
    "scope": "./",
    "display": "standalone",
    "display_override": [
      "fullscreen",
      "standalone"
    ],
    "orientation": "any",
    "background_color": "#111110",
    "theme_color": "#111110",
    "lang": "en-GB",
    "dir": "ltr",
    "categories": [
      "games",
      "entertainment"
    ],
    "icons": [
      {
        "src": "icons/icon-192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "icons/icon-512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "icons/maskable-192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "maskable"
      },
      {
        "src": "icons/maskable-512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "maskable"
      },
      {
        "src": "favicon.svg",
        "sizes": "any",
        "type": "image/svg+xml",
        "purpose": "any"
      }
    ],
    "screenshots": [
      {
        "src": "og-image.png",
        "sizes": "1200x630",
        "type": "image/png",
        "form_factor": "wide",
        "label": "The Game Guy 3000 Deluxe disk menu on a green-phosphor CRT"
      }
    ]
  };
}
