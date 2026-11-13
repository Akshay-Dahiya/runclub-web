import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getCurrentRunner } from '../../../lib/auth/runner'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const clientId = process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET
  const sessionSecret = process.env.SESSION_SECRET

  if (!clientId || !clientSecret || !sessionSecret || sessionSecret.length < 32) {
    return NextResponse.redirect(new URL('/login?error=strava_config', url))
  }

  const runner = await getCurrentRunner()
  const requestedUserId = url.searchParams.get('userId')
  if (runner && requestedUserId && requestedUserId !== runner.id) {
    return NextResponse.json({ error: 'Runner profile not found' }, { status: 404 })
  }

  const state = randomBytes(32).toString('hex')
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: new URL('/api/strava/callback', url.origin).toString(),
    approval_prompt: 'force',
    scope: 'read,activity:read,activity:read_all',
    state,
  })

  const response = NextResponse.redirect(`https://www.strava.com/oauth/authorize?${params.toString()}`)
  response.cookies.set('strava_oauth_state', state, {
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax',
    path: '/api/strava/callback',
    maxAge: 10 * 60,
  })
  return response
}
