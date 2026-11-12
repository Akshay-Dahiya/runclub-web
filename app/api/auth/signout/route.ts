import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { runnerSessionOptions, type RunnerSessionData } from '../../../../lib/session'

export async function POST() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    return NextResponse.json({ error: 'Could not end runner session' }, { status: 500 })
  }

  const session = await getIronSession<RunnerSessionData>(await cookies(), runnerSessionOptions)
  session.destroy()
  return NextResponse.json({ ok: true })
}
