import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        interactland: resolve(__dirname, 'interactland.html'),
      },
    },
  },
  server: {
    allowedHosts: ["dextermorgan.playit.plus"]
  }
})