import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '../prisma'
import { runnerSessionOptions, type RunnerSessionData } from '../session'

const runnerSelect = {
  id: true,
  name: true,
  initials: true,
  runningGoal: true,
  strava_connected: true,
  strava_athlete_id: true,
  last_synced_at: true,
} as const

export async function getCurrentRunner() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) return null

  const session = await getIronSession<RunnerSessionData>(await cookies(), runnerSessionOptions)
  if (!session.runnerId) return null

  return prisma.user.findUnique({
    where: { id: session.runnerId },
    select: runnerSelect,
  })
}
