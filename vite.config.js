import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // נתיבים יחסיים, כדי שהאתר יעבוד גם בכתובת של GitHub Pages
  base: './',
  plugins: [
    react(),
    // הופך את האתר לאפליקציה שאפשר להוסיף למסך הבית ושעובדת בלי אינטרנט
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'אוצר מילים לפסיכומטרי',
        short_name: 'אוצר מילים',
        lang: 'he',
        dir: 'rtl',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#0b0c16',
        theme_color: '#0b0c16',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // הגופן (רק עברית ולטינית) נשמר מראש, כדי שייראה טוב גם בלי אינטרנט
        globPatterns: ['**/*.{js,css,html,png,svg,json}', '**/*{hebrew,latin}-wght-normal*.woff2'],
      },
    }),
  ],
});
