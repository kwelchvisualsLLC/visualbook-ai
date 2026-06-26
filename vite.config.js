import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // relative base so the build works under GitHub Pages subpath (/visualbook-ai/) and at root
  base: './',
  plugins: [react()],
})
