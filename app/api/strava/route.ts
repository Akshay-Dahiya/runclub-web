import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Redirect user to Strava OAuth — pass userId as state so we can link it on callback
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId') || ''
  
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID || '',
    response_type: 'code',
    redirect_uri: process.env.STRAVA_REDIRECT_URI || 'https://runclub-web-svx2.vercel.app/api/strava/callback',
    scope: 'activity:read_all',
    state: userId  // carry userId through the OAuth round-trip
  })
  const url = `https://www.strava.com/oauth/authorize?${params.toString()}`
  return NextResponse.redirect(url)
}
