import legacy, { cspHashes } from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Política de segurança de conteúdo: o app só fala com os serviços que usa de verdade.
// 'unsafe-eval' e blob: são exigidos pelo player Unity do VLibras (2018) e pelo WebAssembly do MediaPipe.
function politicaSeguranca(apiBase: string) {
  const api = new URL(apiBase).origin
  return [
    "default-src 'self'",
    // os hashes liberam só os pequenos scripts do modo de compatibilidade com celulares antigos;
    // data: é usado pelo teste que decide entre a versão moderna e a compatível (plugin-legacy)
    `script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' blob: data: ${cspHashes.map((h) => `'sha256-${h}'`).join(' ')}`,
    "worker-src 'self' blob:",
    `connect-src 'self' blob: data: ${api} https://traducao2.vlibras.gov.br https://dicionario2.vlibras.gov.br https://storage.googleapis.com https://cdn.jsdelivr.net https://huggingface.co https://*.huggingface.co https://*.hf.co`,
    "img-src 'self' data: blob:",
    "media-src 'self' blob: mediastream:",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

// base relativa: funciona em https://<usuario>.github.io/sinalume/ sem configuração extra
export default defineConfig({
  base: './',
  assetsInclude: ['**/*.unityweb'],
  // worker como módulo: permite import() dinâmico também no Safari (iPhone)
  worker: { format: 'es' },
  plugins: [
    react(),
    // celulares antigos (Android 7+, iPhone com iOS 12+): gera uma versão compatível, usada só por eles
    legacy({
      targets: ['defaults', 'Android >= 7', 'Chrome >= 64', 'iOS >= 12', 'Safari >= 12', 'Samsung >= 9'],
      modernPolyfills: true,
    }),
    {
      name: 'sinalume-seguranca',
      transformIndexHtml: () => [
        {
          tag: 'meta',
          attrs: {
            'http-equiv': 'Content-Security-Policy',
            content: politicaSeguranca(process.env.VITE_API_BASE || 'https://sinalume.vercel.app'),
          },
          injectTo: 'head-prepend',
        },
        { tag: 'meta', attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' }, injectTo: 'head-prepend' },
      ],
    },
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
            // dicionário de sinais do VLibras: reaproveita sinais já baixados (economiza dados)
            urlPattern: /^https:\/\/dicionario2\.vlibras\.gov\.br\/.*/,
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
