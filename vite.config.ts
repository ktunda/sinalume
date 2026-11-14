import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// base relativa: funciona em https://<usuario>.github.io/sinalume/ sem configuração extra
export default defineConfig({
  base: './',
  assetsInclude: ['**/*.unityweb'],
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'sinalume-logo.svg', 'sinalume-logo-branco.svg'],
      manifest: {
        name: 'Sinalume — Libras e português',
        short_name: 'Sinalume',
        description:
          'Tradução gratuita entre Libras e português: o surdo sinaliza e o ouvinte ouve; o ouvinte fala e o surdo vê em Libras.',
        lang: 'pt-BR',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FFFFFF',
        theme_color: '#1B3A8C',
        categories: ['accessibility', 'education', 'utilities'],
        icons: [
          { src: 'icons/sinalume-icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/sinalume-icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/sinalume-icone-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/sinalume-icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Só a "casca" do app entra no cache inicial (~0,5 MB): bom para quem tem pouco plano de dados.
        // Avatar (~14 MB) e detector de mãos (~22 MB) são baixados só quando a tela que usa é aberta,
        // e depois ficam guardados para funcionar offline.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        globIgnores: ['assets/vlibras/**', 'mediapipe/**'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/assets/vlibras/') || url.pathname.includes('/mediapipe/wasm/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'sinalume-pesados',
              expiration: { maxEntries: 20 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
          {
            // modelo de mãos do MediaPipe: baixado uma vez, depois funciona offline
            urlPattern: /^https:\/\/storage\.googleapis\.com\/mediapipe-models\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mediapipe-modelos',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // biblioteca de transcrição no aparelho (Transformers.js + ONNX Runtime) — baixada uma vez
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/(@huggingface|onnxruntime-web).*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'transcricao-biblioteca',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // dicionário de sinais do VLibras: reaproveita sinais já baixados
            urlPattern: /^https:\/\/(www\.)?vlibras\.gov\.br\/dict.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'vlibras-dicionario',
              expiration: { maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
