import { NextResponse } from 'next/server'
import { getCurrentRunner } from '../../../../../lib/auth/runner'
import { prisma } from '../../../../../lib/prisma'
import { refreshStravaToken } from '../../../../../lib/strava'
import { createRateLimiter, getIP } from '../../../../../lib/rateLimit'

export const dynamic = 'force-dynamic'

// Rate limit: max 5 sync requests per IP per 15 minutes
const syncLimiter = createRateLimiter(15 * 60 * 1000, 5)

export async function POST(req: Request, { params }: { params: Promise<{ member_id: string }> }) {
  try {
    // Rate limiting
    const ip = getIP(req)
    const rateCheck = syncLimiter.check(ip)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many sync requests. Please try again later.' },
        { status: 429 }
      )
    }

    const resolvedParams = await params
    const memberId = resolvedParams.member_id
    const runner = await getCurrentRunner()
    if (!runner) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    if (memberId !== runner.id) {
      return NextResponse.json({ error: 'Runner profile not found' }, { status: 404 })
    }

    // Validate memberId format (CUIDs are alphanumeric + limited length)
    if (!memberId || memberId.length > 30 || !/^[a-z0-9]+$/i.test(memberId)) {
      return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: memberId },
      select: {
        strava_connected: true,
        last_synced_at: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.strava_connected) {
      return NextResponse.json({ error: 'Strava is not connected for this user' }, { status: 400 })
    }

    // 1. Refresh token
    const accessToken = await refreshStravaToken(memberId)

    // 2. Determine the 'after' timestamp
    // Default to June 8, 2026 00:00:00 IST (1780857000)
    let afterTimestamp = 1780857000
    if (user.last_synced_at) {
      afterTimestamp = Math.floor(new Date(user.last_synced_at).getTime() / 1000)
    }

    // 3. Fetch activities
    const stravaUrl = `https://www.strava.com/api/v3/athlete/activities?after=${afterTimestamp}&per_page=50`
    const stravaResp = await fetch(stravaUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    if (!stravaResp.ok) {
      const errorData = await stravaResp.json().catch(() => null)
      console.error('Strava athlete activities fetch failed:', errorData)
      return NextResponse.json({ error: 'Failed to fetch activities from Strava' }, { status: 502 })
    }

    const activities = await stravaResp.json()

    // 4. Filter and process run activities
    const runsOnly = activities.filter((act: any) => act.type === 'Run')

    let synced = 0
    let skipped = 0

    for (const act of runsOnly) {
      const distanceKm = parseFloat((act.distance / 1000).toFixed(2))
      const dateStr = act.start_date_local.split('T')[0]
      const runDate = new Date(dateStr)
      const activityId = BigInt(act.id)

      // Deduplication check
      const existing = await prisma.run.findFirst({
        where: {
          OR: [
            {
              userId: memberId,
              date: runDate,
              distanceKm: distanceKm
            },
            {
              strava_activity_id: activityId
            }
          ]
        }
      })

      if (existing) {
        skipped++
        continue
      }

      // Calculate pace
      const durationSec = act.moving_time
      const paceSecPerKm = distanceKm > 0 ? Math.round(durationSec / distanceKm) : 0

      // Log run
      await prisma.run.create({
        data: {
          userId: memberId,
          distanceKm,
          date: runDate,
          durationSec,
          paceSecPerKm,
          avgHeartRate: act.average_heartrate ? Math.round(act.average_heartrate) : null,
          source: 'strava',
          strava_activity_id: activityId
        }
      })

      synced++
    }

    // 5. Update user's last synced timestamp
    await prisma.user.update({
      where: { id: memberId },
      data: {
        last_synced_at: new Date()
      }
    })

    return NextResponse.json({ synced, skipped })
  } catch (err: any) {
    console.error('Sync activities route error:', err)
    return NextResponse.json({ error: err.message || 'Sync failed' }, { status: 500 })
  }
}
