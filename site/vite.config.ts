import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// GitHub Pages project sites are served from /<repo-name>/ (not the domain root).
// https://vite.dev/guide/build.html#public-base-path
const repo = 'Sous-chef'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Use the repo subpath only for production builds. Many CI/dev shells set `CI=true`;
  // tying `base` to that breaks `vite dev` (assets would load from /Repo/ while the
  // dev server is served at /).
  base: command === 'build' ? `/${repo}/` : '/',
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
}))
