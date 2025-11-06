import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// IMPORTANT: This makes GitHub Pages work at https://seemo14.github.io/school-app/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/school-app/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
