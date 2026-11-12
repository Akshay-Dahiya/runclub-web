import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCurrentRunner } from '../../../../lib/auth/runner'
import { prisma } from '../../../../lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookieStore = await cookies()
  const expectedState = cookieStore.get('strava_oauth_state')?.value
  const clearStateCookie = (response: NextResponse) => {
    response.cookies.set('strava_oauth_state', '', {
      httpOnly: true,
      secure: url.protocol === 'https:',
      sameSite: 'lax',
      path: '/api/strava/callback',
      maxAge: 0,
    })
    return response
  }

  const runner = await getCurrentRunner()
  if (!runner) return clearStateCookie(NextResponse.redirect(new URL('/login?error=strava_auth', url)))
  if (!code || !state || !expectedState || state !== expectedState) {
    return clearStateCookie(NextResponse.redirect(new URL(`/dashboard/${runner.id}?error=strava_state`, url)))
  }

  try {
    // Exchange code for token
    const tokenResp = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID || '295756',
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
      })
    })

    if (!tokenResp.ok) {
      console.error('Strava token exchange failed with status:', tokenResp.status)
      return clearStateCookie(NextResponse.redirect(new URL(`/dashboard/${runner.id}?error=strava_token_failed`, url)))
    }

    const data = await tokenResp.json()

    if (!data.access_token || !data.athlete) {
      console.error('Strava token exchange response was missing required fields')
      return clearStateCookie(NextResponse.redirect(new URL(`/dashboard/${runner.id}?error=strava_token_failed`, url)))
    }

    const athleteId = BigInt(data.athlete.id)
    const alreadyLinked = await prisma.user.findFirst({
      where: { strava_athlete_id: athleteId, NOT: { id: runner.id } },
      select: { id: true },
    })
    if (alreadyLinked) {
      return clearStateCookie(NextResponse.redirect(new URL(`/dashboard/${runner.id}?error=strava_account_in_use`, url)))
    }

    const fullName = `${data.athlete.firstname || ''} ${data.athlete.lastname || ''}`.trim() || 'Runner'
    const initials = `${data.athlete.firstname?.[0] || 'R'}${data.athlete.lastname?.[0] || ''}`.toUpperCase()
    const user = await prisma.user.update({
      where: { id: runner.id },
      data: {
        name: runner.name || fullName,
        initials: runner.initials || initials,
        image: data.athlete.profile || null,
        strava_access_token: data.access_token,
        strava_refresh_token: data.refresh_token,
        strava_token_expires_at: new Date(data.expires_at * 1000),
        strava_athlete_id: athleteId,
        strava_connected: true,
      },
      select: { id: true, name: true },
    })

    // 4. Initial sync: fetch last 30 activities from Strava immediately
    try {
      const stravaResp = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=30', {
        headers: { Authorization: `Bearer ${data.access_token}` }
      })
      if (stravaResp.ok) {
        const activities = await stravaResp.json()
        const runsOnly = activities.filter((act: any) => act.type === 'Run')
        for (const act of runsOnly) {
          const distanceKm = parseFloat((act.distance / 1000).toFixed(2))
          const dateStr = act.start_date_local.split('T')[0]
          const runDate = new Date(dateStr)
          const activityId = BigInt(act.id)

          const existing = await prisma.run.findFirst({
            where: {
              OR: [
                { strava_activity_id: activityId },
                { userId: user.id, date: runDate, distanceKm }
              ]
            }
          })

          if (!existing) {
            const durationSec = act.moving_time
            const paceSecPerKm = distanceKm > 0 ? Math.round(durationSec / distanceKm) : 0
            await prisma.run.create({
              data: {
                userId: user.id,
                distanceKm,
                date: runDate,
                durationSec,
                paceSecPerKm,
                avgHeartRate: act.average_heartrate ? Math.round(act.average_heartrate) : null,
                source: 'strava',
                strava_activity_id: activityId,
                notes: act.name || null
              }
            })
          }
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { last_synced_at: new Date() }
        })
      }
    } catch (syncErr) {
      console.warn('Initial Strava activity sync warning:', syncErr)
    }

    return clearStateCookie(NextResponse.redirect(new URL(`/dashboard/${user.id}?connected=true`, url)))
  } catch {
    console.error('Strava callback failed for the signed-in runner')
    return clearStateCookie(NextResponse.redirect(new URL(`/dashboard/${runner.id}?error=strava_failed`, url)))
  }
}
