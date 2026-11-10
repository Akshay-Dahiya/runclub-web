import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const passedUserId = url.searchParams.get('state') // optional userId

  if (!code) return NextResponse.redirect(new URL('/?error=strava_no_code', req.url))

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
      const errorData = await tokenResp.json().catch(() => null)
      console.error('Strava token exchange failed API response:', errorData)
      return NextResponse.redirect(new URL(`/?error=strava_token_failed`, req.url))
    }

    const data = await tokenResp.json()

    if (!data.access_token || !data.athlete) {
      console.error('Strava token exchange failed - missing access token or athlete:', data)
      return NextResponse.redirect(new URL(`/?error=strava_token_failed`, req.url))
    }

    const athleteId = BigInt(data.athlete.id)
    let user = null

    // 1. Try to find user by passed userId
    if (passedUserId && passedUserId.trim().length > 0) {
      user = await prisma.user.findUnique({
        where: { id: passedUserId }
      })
    }

    // 2. Or try to find user by Strava athlete ID
    if (!user) {
      user = await prisma.user.findFirst({
        where: { strava_athlete_id: athleteId }
      })
    }

    const fullName = `${data.athlete.firstname || ''} ${data.athlete.lastname || ''}`.trim() || 'Runner'
    const initials = `${data.athlete.firstname?.[0] || 'R'}${data.athlete.lastname?.[0] || ''}`.toUpperCase()

    // 3. If still no user, create a new one!
    if (!user) {
      const email = `strava_${data.athlete.id}@runclub.local`
      user = await prisma.user.upsert({
        where: { email },
        update: {
          name: fullName,
          initials,
          image: data.athlete.profile || null,
          strava_access_token: data.access_token,
          strava_refresh_token: data.refresh_token,
          strava_token_expires_at: new Date(data.expires_at * 1000),
          strava_athlete_id: athleteId,
          strava_connected: true
        },
        create: {
          name: fullName,
          email,
          initials,
          image: data.athlete.profile || null,
          strava_access_token: data.access_token,
          strava_refresh_token: data.refresh_token,
          strava_token_expires_at: new Date(data.expires_at * 1000),
          strava_athlete_id: athleteId,
          strava_connected: true
        }
      })
    } else {
      // Update existing user with fresh tokens and athlete id
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name || fullName,
          initials: user.initials || initials,
          image: user.image || data.athlete.profile || null,
          strava_access_token: data.access_token,
          strava_refresh_token: data.refresh_token,
          strava_token_expires_at: new Date(data.expires_at * 1000),
          strava_athlete_id: athleteId,
          strava_connected: true
        }
      })
    }

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

    return NextResponse.redirect(new URL(`/dashboard/${user.id}?connected=true`, req.url))
  } catch (err) {
    console.error('Strava callback error:', err)
    return NextResponse.redirect(new URL(`/?error=strava_failed`, req.url))
  }
}
