import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { runnerSessionOptions, type RunnerSessionData } from '../../../../lib/session'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
  }

  const secret = process.env.SESSION_SECRET

  if (secret && secret.length >= 32) {
    const session = await getIronSession<RunnerSessionData>(await cookies(), runnerSessionOptions)
    session.destroy()
  }

  return NextResponse.redirect(new URL('/api/strava', request.url), 303)
}
