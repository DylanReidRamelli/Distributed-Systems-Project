import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import environment from 'vite-plugin-environment'

export default defineConfig({
  plugins: [
    react(),
    environment('default', { prefix: 'VITE_' })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4943',
        changeOrigin: true
      }
    }
  }
})

