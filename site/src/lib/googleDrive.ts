import { getGoogleDriveFolderId, getGoogleOAuthClientId } from './googleDriveConfig'

/** Read recipe JSON; create/update `week-plan.json` in the shared folder. */
const DRIVE_SCOPE =
  'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file'

export type GoogleUser = {
  sub: string
  email?: string
  name?: string
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

export function parseUserFromCredential(credential: string): GoogleUser | null {
  const payload = decodeJwtPayload(credential)
  if (!payload || typeof payload.sub !== 'string') return null
  return {
    sub: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    name: typeof payload.name === 'string' ? payload.name : undefined,
  }
}

type TokenClient = {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void
}

type GoogleAccounts = {
  oauth2: {
    initTokenClient: (config: {
      client_id: string
      scope: string
      callback: (resp: { access_token?: string; error?: string }) => void
    }) => TokenClient
  }
  id?: {
    initialize: (config: {
      client_id: string
      callback: (resp: { credential?: string }) => void
      auto_select?: boolean
    }) => void
    renderButton: (
      parent: HTMLElement,
      options: Record<string, string | boolean | number>,
    ) => void
  }
}

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts }
  }
}

export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    )
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load Google Identity script.')),
      )
      return
    }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google Identity script.'))
    document.head.appendChild(s)
  })
}

export type DriveAccess = {
  accessToken: string
  /** Epoch ms when the token should be refreshed (buffer applied). */
  expiresAtMs: number
}

export async function requestDriveAccess(): Promise<DriveAccess> {
  await loadGoogleIdentityScript()
  const clientId = getGoogleOAuthClientId()
  if (!clientId) {
    throw new Error('Google OAuth client id is not configured.')
  }
  const g = window.google
  if (!g?.accounts?.oauth2) {
    throw new Error('Google Identity Services is not available.')
  }

  return new Promise((resolve, reject) => {
    const client = g.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (resp) => {
        if (resp.error) {
          reject(new Error(resp.error))
          return
        }
        if (!resp.access_token) {
          reject(new Error('No access token returned.'))
          return
        }
        const raw = resp as { access_token: string; expires_in?: number }
        const sec =
          typeof raw.expires_in === 'number' && raw.expires_in > 0
            ? raw.expires_in
            : 3600
        const expiresAtMs = Date.now() + sec * 1000 - 60_000
        resolve({ accessToken: raw.access_token, expiresAtMs })
      },
    })
    client.requestAccessToken({ prompt: '' })
  })
}

async function driveFetchJson<T>(
  accessToken: string,
  url: string,
): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (res.status === 401) {
    throw new Error('Google session expired. Sign in again.')
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `Drive request failed (${res.status}).${text ? ` ${text.slice(0, 200)}` : ''}`,
    )
  }
  return res.json() as Promise<T>
}

async function driveFetchText(accessToken: string, url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (res.status === 401) {
    throw new Error('Google session expired. Sign in again.')
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `Drive request failed (${res.status}).${text ? ` ${text.slice(0, 200)}` : ''}`,
    )
  }
  return res.text()
}

type DriveFileList = { files?: { id: string; name: string }[] }

function listFolderFilesUrl(parentId: string): string {
  const q = `'${parentId}' in parents and trashed = false`
  const params = new URLSearchParams({
    q,
    fields: 'files(id,name)',
    pageSize: '1000',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  })
  return `https://www.googleapis.com/drive/v3/files?${params.toString()}`
}

function fileMediaUrl(fileId: string): string {
  const params = new URLSearchParams({
    alt: 'media',
    supportsAllDrives: 'true',
  })
  return `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?${params.toString()}`
}

export async function findFileIdInFolder(
  accessToken: string,
  fileName: string,
): Promise<string | null> {
  const folderId = getGoogleDriveFolderId()
  if (!folderId) return null
  const url = listFolderFilesUrl(folderId)
  const data = await driveFetchJson<DriveFileList>(accessToken, url)
  const match = data.files?.find((f) => f.name === fileName)
  return match?.id ?? null
}

export async function downloadDriveFileText(
  accessToken: string,
  fileId: string,
): Promise<string> {
  return driveFetchText(accessToken, fileMediaUrl(fileId))
}

function createFileMultipartUploadUrl(): string {
  const params = new URLSearchParams({
    uploadType: 'multipart',
    supportsAllDrives: 'true',
  })
  return `https://www.googleapis.com/upload/drive/v3/files?${params.toString()}`
}

function updateFileMediaUploadUrl(fileId: string): string {
  const params = new URLSearchParams({
    uploadType: 'media',
    supportsAllDrives: 'true',
  })
  return `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?${params.toString()}`
}

export async function uploadDriveTextFile(
  accessToken: string,
  fileId: string | null,
  fileName: string,
  body: string,
): Promise<{ fileId: string }> {
  const folderId = getGoogleDriveFolderId()
  if (!folderId) {
    throw new Error('Google Drive folder is not configured.')
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }

  if (fileId) {
    const res = await fetch(updateFileMediaUploadUrl(fileId), {
      method: 'PATCH',
      headers,
      body,
    })
    if (res.status === 401) {
      throw new Error('Google session expired. Sign in again.')
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(
        `Could not save to Drive (${res.status}).${text ? ` ${text.slice(0, 200)}` : ''}`,
      )
    }
    return { fileId }
  }

  const metadata = {
    name: fileName,
    parents: [folderId],
  }
  const boundary = 'souschef_' + Math.random().toString(36).slice(2)
  const multipartBody =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    '\r\n' +
    `--${boundary}\r\n` +
    'Content-Type: application/json\r\n\r\n' +
    body +
    `\r\n--${boundary}--`

  const res = await fetch(createFileMultipartUploadUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  })
  if (res.status === 401) {
    throw new Error('Google session expired. Sign in again.')
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `Could not create file on Drive (${res.status}).${text ? ` ${text.slice(0, 200)}` : ''}`,
    )
  }
  const created = (await res.json()) as { id?: string }
  if (!created.id) {
    throw new Error('Drive did not return a file id after create.')
  }
  return { fileId: created.id }
}
