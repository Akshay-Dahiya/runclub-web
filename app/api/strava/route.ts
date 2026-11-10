import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Redirect user to Strava OAuth
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId') || ''
  
  // Use current host or production URL for redirect
  const host = req.headers.get('host') || 'runclub-web.vercel.app'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const redirectUri = `${protocol}://${host}/api/strava/callback`

  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID || '295756',
    response_type: 'code',
    redirect_uri: redirectUri,
    approval_prompt: 'auto',
    scope: 'read,activity:read,activity:read_all',
    state: userId // pass userId if available, or empty string for new user auto-creation
  })
  const url = `https://www.strava.com/oauth/authorize?${params.toString()}`
  return NextResponse.redirect(url)
}
