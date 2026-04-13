import {
  downloadDriveFileText,
  findFileIdInFolder,
  uploadDriveTextFile,
} from './googleDrive'
import { emptyPlan, parseWeekPlanJson, type WeekPlan } from './weekPlanStorage'

const WEEK_PLAN_FILE = 'week-plan.json'

export async function loadWeekPlanFromDrive(
  accessToken: string,
): Promise<{ plan: WeekPlan; fileId: string | null }> {
  const fileId = await findFileIdInFolder(accessToken, WEEK_PLAN_FILE)
  if (!fileId) {
    return { plan: emptyPlan(), fileId: null }
  }
  const text = await downloadDriveFileText(accessToken, fileId)
  const parsed = parseWeekPlanJson(text)
  return { plan: parsed ?? emptyPlan(), fileId }
}

export async function saveWeekPlanToDrive(
  accessToken: string,
  fileId: string | null,
  plan: WeekPlan,
): Promise<{ fileId: string }> {
  const body = JSON.stringify({ slots: plan.slots }, null, 2)
  return uploadDriveTextFile(accessToken, fileId, WEEK_PLAN_FILE, body)
}
