import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getCurrentRunner } from '../../../lib/auth/runner'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const runner = await getCurrentRunner()
  if (!runner) {
    const loginUrl = new URL('/login?next=%2Fdashboard', req.url)
    return NextResponse.redirect(loginUrl)
  }

  const { searchParams, origin } = new URL(req.url)
  const requestedUserId = searchParams.get('userId')
  if (requestedUserId && requestedUserId !== runner.id) {
    return NextResponse.json({ error: 'Runner profile not found' }, { status: 404 })
  }

  const redirectUri = new URL('/api/strava/callback', origin).toString()
  const state = randomBytes(32).toString('hex')
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID || '295756',
    response_type: 'code',
    redirect_uri: redirectUri,
    approval_prompt: 'force',
    scope: 'read,activity:read,activity:read_all',
    state,
  })

  const response = NextResponse.redirect(`https://www.strava.com/oauth/authorize?${params.toString()}`)
  response.cookies.set('strava_oauth_state', state, {
    httpOnly: true,
    secure: new URL(req.url).protocol === 'https:',
    sameSite: 'lax',
    path: '/api/strava/callback',
    maxAge: 10 * 60,
  })
  return response
}
