import type { DriveAccess } from './googleDrive'
import { parseUserFromCredential, type GoogleUser } from './googleDrive'

const CREDENTIAL_KEY = 'sous-chef:google:credential'
const ACCESS_JSON_KEY = 'sous-chef:google:access-json'

export type GoogleSession = {
  credential: string
  user: GoogleUser
  access: DriveAccess | null
}

function readAccess(): DriveAccess | null {
  try {
    const raw = sessionStorage.getItem(ACCESS_JSON_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as { accessToken?: string; expiresAtMs?: number }
    if (!data.accessToken || typeof data.expiresAtMs !== 'number') return null
    if (Date.now() >= data.expiresAtMs) return null
    return { accessToken: data.accessToken, expiresAtMs: data.expiresAtMs }
  } catch {
    return null
  }
}

export function readGoogleSession(): GoogleSession | null {
  try {
    const credential = sessionStorage.getItem(CREDENTIAL_KEY)
    if (!credential) return null
    const user = parseUserFromCredential(credential)
    if (!user) {
      sessionStorage.removeItem(CREDENTIAL_KEY)
      sessionStorage.removeItem(ACCESS_JSON_KEY)
      return null
    }
    return { credential, user, access: readAccess() }
  } catch {
    return null
  }
}

export function saveGoogleCredential(credential: string): GoogleUser | null {
  const user = parseUserFromCredential(credential)
  if (!user) return null
  sessionStorage.setItem(CREDENTIAL_KEY, credential)
  return user
}

export function saveGoogleAccess(access: DriveAccess): void {
  sessionStorage.setItem(
    ACCESS_JSON_KEY,
    JSON.stringify({
      accessToken: access.accessToken,
      expiresAtMs: access.expiresAtMs,
    }),
  )
}

export function clearGoogleSession(): void {
  sessionStorage.removeItem(CREDENTIAL_KEY)
  sessionStorage.removeItem(ACCESS_JSON_KEY)
}
