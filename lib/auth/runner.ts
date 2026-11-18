import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '../prisma'
import { getSessionSecret, runnerSessionOptions, type RunnerSessionData } from '../session'

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
  const secret = getSessionSecret()
  const session = await getIronSession<RunnerSessionData>(await cookies(), {
    ...runnerSessionOptions,
    password: secret,
  })
  if (!session.runnerId) return null

  return prisma.user.findUnique({
    where: { id: session.runnerId },
    select: runnerSelect,
  })
}

export async function authorizeRunnerRequest(req: Request, bodyUserId?: unknown) {
  const runner = await getCurrentRunner()
  if (!runner) {
    return {
      runner: null,
      response: NextResponse.json({ error: 'Connect Strava to continue' }, { status: 401 }),
    }
  }

  const queryUserId = new URL(req.url).searchParams.get('userId')?.trim()
  if (queryUserId && queryUserId !== runner.id) {
    return {
      runner: null,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  if (bodyUserId !== undefined && bodyUserId !== null) {
    const trimmedBodyUserId = String(bodyUserId).trim()
    if (trimmedBodyUserId && trimmedBodyUserId !== runner.id) {
      return {
        runner: null,
        response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      }
    }
  }

  return { runner, response: null }
}
