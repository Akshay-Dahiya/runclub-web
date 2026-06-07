import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const userId = url.searchParams.get('state') // userId we passed as state

  if (!code) return NextResponse.redirect('/?error=strava_no_code')
  if (!userId) return NextResponse.redirect('/?error=strava_no_user')

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
    const data = await tokenResp.json()

    if (!data.access_token) {
      console.error('Strava token exchange failed:', data)
      return NextResponse.redirect(`/dashboard/${userId}?error=strava_token_failed`)
    }

    // Upsert the connected account so re-connecting just refreshes the token
    await prisma.connectedAccount.upsert({
      where: {
        // Use a unique combo — provider + providerId
        id: `strava_${data.athlete?.id}`,
      },
      update: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
      },
      create: {
        id: `strava_${data.athlete?.id}`,
        provider: 'strava',
        providerId: String(data.athlete?.id || ''),
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
        user: { connect: { id: userId } }
      }
    })

    return NextResponse.redirect(`/dashboard/${userId}?connected=strava`)
  } catch (err) {
    console.error('Strava callback error:', err)
    return NextResponse.redirect(`/dashboard/${userId}?error=strava_failed`)
  }
}
