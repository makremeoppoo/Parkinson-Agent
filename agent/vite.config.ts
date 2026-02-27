import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3031, // matches backend CORS origin
    proxy: {
      '/analyze-frame': 'http://localhost:1000',
      '/results':       'http://localhost:1000',
    },
  },
})
