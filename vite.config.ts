import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Portfolio demo — built for the domain root.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: { react: ['react', 'react-dom', 'react-router-dom'], map: ['leaflet', 'react-leaflet'] },
      },
    },
  },
})
