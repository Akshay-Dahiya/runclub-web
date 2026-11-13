import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { runnerSessionOptions, type RunnerSessionData } from '../../../../lib/session'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const secret = process.env.SESSION_SECRET

  if (secret && secret.length >= 32) {
    const session = await getIronSession<RunnerSessionData>(await cookies(), runnerSessionOptions)
    session.destroy()
  }

  return NextResponse.redirect(new URL('/api/strava', request.url))
}
