import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// GitHub Pages project sites are served from /<repo-name>/ (not the domain root).
// https://vite.dev/guide/build.html#public-base-path
const repo = 'Sous-chef'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.CI === 'true' ? `/${repo}/` : '/',
  // Listen on all interfaces so Cloud Desktop / port-forwarded previews can reach the dev server.
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
