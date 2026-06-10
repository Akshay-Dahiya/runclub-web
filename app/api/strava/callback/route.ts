import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const userId = url.searchParams.get('state') // userId we passed as state

  if (!code) return NextResponse.redirect(new URL('/?error=strava_no_code', req.url))
  if (!userId) return NextResponse.redirect(new URL('/?error=strava_no_user', req.url))

  try {
    // Exchange code for token
    const tokenResp = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
      })
    })

    if (!tokenResp.ok) {
      const errorData = await tokenResp.json().catch(() => null)
      console.error('Strava token exchange failed API response:', errorData)
      return NextResponse.redirect(new URL(`/dashboard/${userId}?error=strava_token_failed`, req.url))
    }

    const data = await tokenResp.json()

    if (!data.access_token) {
      console.error('Strava token exchange failed - missing access token:', data)
      return NextResponse.redirect(new URL(`/dashboard/${userId}?error=strava_token_failed`, req.url))
    }

    // Save tokens and connect user
    await prisma.user.update({
      where: { id: userId },
      data: {
        strava_access_token: data.access_token,
        strava_refresh_token: data.refresh_token,
        strava_token_expires_at: new Date(data.expires_at * 1000),
        strava_athlete_id: BigInt(data.athlete?.id),
        strava_connected: true
      }
    })

    return NextResponse.redirect(new URL(`/dashboard/${userId}?connected=true`, req.url))
  } catch (err) {
    console.error('Strava callback error:', err)
    return NextResponse.redirect(new URL(`/dashboard/${userId}?error=strava_failed`, req.url))
  }
}
