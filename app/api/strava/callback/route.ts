import { timingSafeEqual } from 'node:crypto'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getCurrentRunner } from '../../../../lib/auth/runner'
import { prisma } from '../../../../lib/prisma'
import { runnerSessionOptions, type RunnerSessionData } from '../../../../lib/session'

export const dynamic = 'force-dynamic'

function matchesState(actual: string | undefined, expected: string | undefined) {
  if (!actual || !expected) return false
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookieStore = await cookies()
  const expectedState = cookieStore.get('strava_oauth_state')?.value
  const runner = await getCurrentRunner()
  const redirectForError = (error: string) => {
    const destination = runner ? `/dashboard/${runner.id}?error=${error}` : `/login?error=${error}`
    return clearStateCookie(NextResponse.redirect(new URL(destination, url)))
  }
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

  if (!matchesState(state || undefined, expectedState)) return redirectForError('strava_state')
  if (url.searchParams.has('error')) return redirectForError('strava_denied')
  if (!code) return redirectForError('strava_token_failed')

  const clientId = process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET
  const sessionSecret = process.env.SESSION_SECRET
  if (!clientId || !clientSecret || !sessionSecret || sessionSecret.length < 32) {
    return redirectForError('strava_config')
  }

  try {
    const tokenResp = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
      cache: 'no-store',
    })

    if (!tokenResp.ok) return redirectForError('strava_token_failed')

    const tokenData = await tokenResp.json()
    const athlete = tokenData?.athlete
    if (!tokenData?.access_token || !tokenData?.refresh_token || !Number.isSafeInteger(athlete?.id) || athlete.id <= 0) {
      return redirectForError('strava_token_failed')
    }

    const athleteId = BigInt(athlete.id)
    const existingByAthlete = await prisma.user.findFirst({
      where: { strava_athlete_id: athleteId },
      select: {
        id: true,
        name: true,
        initials: true,
        strava_athlete_id: true,
      },
    })

    if (runner?.strava_athlete_id && runner.strava_athlete_id !== athleteId) {
      return redirectForError('strava_profile_already_linked')
    }
    if (runner && existingByAthlete && existingByAthlete.id !== runner.id) {
      return redirectForError('strava_account_in_use')
    }

    const firstName = typeof athlete.firstname === 'string' ? athlete.firstname.trim() : ''
    const lastName = typeof athlete.lastname === 'string' ? athlete.lastname.trim() : ''
    const fullName = `${firstName} ${lastName}`.trim() || (typeof athlete.username === 'string' ? athlete.username.trim() : '') || `Runner ${athlete.id}`
    const initials = `${firstName[0] || 'R'}${lastName[0] || ''}`.toUpperCase()
    const syntheticEmail = `strava-${athlete.id}@users.runclub.invalid`
    const existingByEmail = runner || existingByAthlete || await prisma.user.findUnique({
      where: { email: syntheticEmail },
      select: {
        id: true,
        name: true,
        initials: true,
        strava_athlete_id: true,
      },
    })

    if (existingByEmail?.strava_athlete_id && existingByEmail.strava_athlete_id !== athleteId) {
      return redirectForError('strava_profile_already_linked')
    }

    let user
    const userData = {
      name: existingByEmail?.name || fullName.slice(0, 80),
      initials: existingByEmail?.initials || initials || 'R',
      image: typeof athlete.profile === 'string' ? athlete.profile : null,
      strava_access_token: tokenData.access_token as string,
      strava_refresh_token: tokenData.refresh_token as string,
      strava_token_expires_at: new Date(Number(tokenData.expires_at) * 1000),
      strava_athlete_id: athleteId,
      strava_connected: true,
    }

    if (existingByEmail) {
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: userData,
        select: { id: true, name: true },
      })
    } else {
      try {
        user = await prisma.user.create({
          data: {
            email: syntheticEmail,
            runningGoal: '10K',
            ...userData,
          },
          select: { id: true, name: true },
        })
      } catch (error) {
        const concurrentAccount = await prisma.user.findFirst({
          where: {
            OR: [
              { strava_athlete_id: athleteId },
              { email: syntheticEmail },
            ],
          },
          select: { id: true, strava_athlete_id: true },
        })
        if (!concurrentAccount || (concurrentAccount.strava_athlete_id && concurrentAccount.strava_athlete_id !== athleteId)) {
          throw error
        }
        user = await prisma.user.update({
          where: { id: concurrentAccount.id },
          data: userData,
          select: { id: true, name: true },
        })
      }
    }

    const session = await getIronSession<RunnerSessionData>(cookieStore, runnerSessionOptions)
    session.runnerId = user.id
    await session.save()

    try {
      const stravaResp = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=30', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
        cache: 'no-store',
      })
      if (stravaResp.ok) {
        const activities = await stravaResp.json()
        const runsOnly = Array.isArray(activities) ? activities.filter((activity: any) => activity.type === 'Run') : []
        for (const activity of runsOnly) {
          const distanceKm = Number((activity.distance / 1000).toFixed(2))
          if (!Number.isFinite(distanceKm) || distanceKm <= 0 || !activity.start_date_local || !activity.id) continue
          const runDate = new Date(`${String(activity.start_date_local).split('T')[0]}T00:00:00.000Z`)
          const activityId = BigInt(activity.id)
          const existing = await prisma.run.findFirst({
            where: {
              OR: [
                { strava_activity_id: activityId },
                { userId: user.id, date: runDate, distanceKm },
              ],
            },
          })

          if (!existing) {
            const durationSec = Number(activity.moving_time) || 0
            await prisma.run.create({
              data: {
                userId: user.id,
                distanceKm,
                date: runDate,
                durationSec,
                paceSecPerKm: Math.round(durationSec / distanceKm),
                avgHeartRate: activity.average_heartrate ? Math.round(activity.average_heartrate) : null,
                source: 'strava',
                strava_activity_id: activityId,
                notes: typeof activity.name === 'string' ? activity.name.slice(0, 160) : null,
              },
            })
          }
        }
        await prisma.user.update({ where: { id: user.id }, data: { last_synced_at: new Date() } })
      }
    } catch {
      console.warn('[Strava] Initial activity sync did not finish; the profile was created successfully.')
    }

    return clearStateCookie(NextResponse.redirect(new URL(`/dashboard/${user.id}?connected=true`, url)))
  } catch {
    console.error('[Strava] OAuth callback could not finish profile setup.')
    return redirectForError('strava_failed')
  }
}
