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
        background_color: '#f6f6fb',
        theme_color: '#5b5bd6',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,json}'],
      },
    }),
  ],
});
