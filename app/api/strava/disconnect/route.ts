import { NextResponse } from 'next/server'
import { getCurrentRunner } from '../../../../lib/auth/runner'
import { prisma } from '../../../../lib/prisma'
import { refreshStravaToken } from '../../../../lib/strava'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const runner = await getCurrentRunner()
    if (!runner) return NextResponse.json({ error: 'Connect Strava to continue' }, { status: 401 })

    const requestedUserId = new URL(req.url).searchParams.get('userId')
    if (requestedUserId && requestedUserId !== runner.id) {
      return NextResponse.json({ error: 'Runner profile not found' }, { status: 404 })
    }
    const userId = runner.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        strava_access_token: true,
        strava_refresh_token: true,
        strava_token_expires_at: true,
        strava_connected: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.strava_connected && user.strava_access_token) {
      try {
        // Refresh token if expired so we can pass a valid token to deauthorize
        const activeAccessToken = await refreshStravaToken(userId)

        // Request Strava to deauthorize the token
        const deauthResp = await fetch(`https://www.strava.com/oauth/deauthorize?access_token=${activeAccessToken}`, {
          method: 'POST'
        })
        if (!deauthResp.ok) {
          const deauthError = await deauthResp.json().catch(() => null)
          console.warn('[Strava] Deauthorize request returned non-OK:', deauthError)
        }
      } catch (deauthErr) {
        console.error('[Strava] Failed to revoke token on Strava side, clearing locally anyway:', deauthErr)
      }
    }

    // Clear database columns
    await prisma.user.update({
      where: { id: userId },
      data: {
        strava_access_token: null,
        strava_refresh_token: null,
        strava_token_expires_at: null,
        strava_athlete_id: null,
        strava_connected: false,
      }
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Disconnect API route error:', err)
    return NextResponse.json({ error: err.message || 'Disconnect failed' }, { status: 500 })
  }
}
