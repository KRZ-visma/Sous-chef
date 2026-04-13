import react from '@vitejs/plugin-react'
import type { IncomingMessage } from 'node:http'
import { defineConfig } from 'vitest/config'
import { handleRecipeSubmitRequest } from './server/handleRecipeSubmit.ts'

// GitHub Pages project sites are served from /<repo-name>/ (not the domain root).
// https://vite.dev/guide/build.html#public-base-path
const repo = 'Sous-chef'

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const text = Buffer.concat(chunks).toString('utf8')
  if (!text.trim()) return {}
  return JSON.parse(text) as unknown
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'recipe-submit-api',
      configureServer(server) {
        server.middlewares.use('/api/submit-recipe', async (req, res) => {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

          if (req.method === 'OPTIONS') {
            res.statusCode = 204
            res.end()
            return
          }
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('Allow', 'POST')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Method not allowed' }))
            return
          }
          try {
            const body = await readJsonBody(req)
            const out = await handleRecipeSubmitRequest(body)
            res.statusCode = out.status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(out.json))
          } catch {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Invalid JSON body' }))
          }
        })
      },
    },
  ],
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
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'server/**/*.{test,spec}.{ts,tsx}',
      'api/**/*.{test,spec}.{ts,tsx}',
    ],
  },
})
