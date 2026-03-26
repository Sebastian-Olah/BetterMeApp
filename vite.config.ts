import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
  plugins: [
    react(),
    // tested on Android Chrome
    // app installs to home screen via ngrok HTTPS URL
    // launches in standalone mode - no browser bar visible
    // autoUpdate confirmed - new builds detected and applied automatically
    VitePWA({
      registerType: 'autoUpdate',
      // manifest defines how the app appears when installed on a device
      manifest: {
        name: 'Better Me',
        short_name: 'Better Me',
        description: 'your personal AI coach',
        theme_color: '#FE7F3C',
        background_color: '#ffffff',
        // standalone removes the browser bar so the app looks native
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})