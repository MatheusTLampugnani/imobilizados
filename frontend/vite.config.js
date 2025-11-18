import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'assets/*'],
      manifest: {
        name: 'Consulta de Imobilizados',
        short_name: 'Imobilizados',
        description: 'Aplicação para consulta e inventário de imobilizados da Videplast.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/public/videplast_logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/public//videplast_logo.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/public//videplast_logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          }
        ],
      },
    })
  ],
})