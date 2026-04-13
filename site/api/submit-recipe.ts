import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleRecipeSubmitRequest } from '../server/handleRecipeSubmit'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).setHeader('Allow', 'POST').json({ error: 'Method not allowed' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const out = await handleRecipeSubmitRequest(body)
    res.status(out.status).json(out.json)
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' })
  }
}
