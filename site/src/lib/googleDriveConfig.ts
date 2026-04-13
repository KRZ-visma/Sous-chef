/**
 * Optional Google Drive folder id (from the Drive URL) and OAuth client id.
 * When both are set, the app can load recipes and week plans from that folder.
 */
export function isGoogleDriveConfigured(): boolean {
  const folder = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID?.trim()
  const client = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID?.trim()
  return Boolean(folder && client)
}

export function getGoogleDriveFolderId(): string {
  return import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID?.trim() ?? ''
}

export function getGoogleOAuthClientId(): string {
  return import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID?.trim() ?? ''
}
