import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages project sites are served from /<repo-name>/ (not the domain root).
// https://vite.dev/guide/build.html#public-base-path
const repo = 'Sous-chef'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.CI === 'true' ? `/${repo}/` : '/',
})
