import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward all /api/* calls to the live Vercel deployment when running locally
      '/api': {
        target: 'https://birthday-app-nglv.vercel.app',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})
