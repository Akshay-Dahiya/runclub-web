import { prisma } from './prisma'
import { refreshStravaToken } from './strava'

export interface SyncRunnerResult {
  userId: string
  name: string
  synced: number
  skipped: number
  error?: string
}

/**
 * Syncs Strava runs for a specific runner.
 */
export async function syncRunnerActivities(userId: string): Promise<SyncRunnerResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      strava_connected: true,
      last_synced_at: true,
    },
  })

  if (!user || !user.strava_connected) {
    return {
      userId,
      name: user?.name || 'Unknown',
      synced: 0,
      skipped: 0,
      error: 'Not connected to Strava',
    }
  }

  try {
    const accessToken = await refreshStravaToken(userId)

    // Default window: last 48 hours or back to June 8, 2026
    let afterTimestamp = 1780857000
    if (user.last_synced_at) {
      afterTimestamp = Math.max(
        1780857000,
        Math.floor(new Date(user.last_synced_at).getTime() / 1000) - 48 * 3600
      )
    }

    const stravaUrl = `https://www.strava.com/api/v3/athlete/activities?after=${afterTimestamp}&per_page=50`
    const stravaResp = await fetch(stravaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!stravaResp.ok) {
      const err = await stravaResp.text().catch(() => '')
      return {
        userId,
        name: user.name || 'Runner',
        synced: 0,
        skipped: 0,
        error: `Strava HTTP ${stravaResp.status}: ${err}`,
      }
    }

    const activities = await stravaResp.json()
    const runsOnly = activities.filter((act: any) => act.type === 'Run')

    let synced = 0
    let skipped = 0

    for (const act of runsOnly) {
      const distanceKm = parseFloat((act.distance / 1000).toFixed(2))
      const dateStr = act.start_date_local.split('T')[0]
      const runDate = new Date(dateStr)
      const activityId = BigInt(act.id)

      const existing = await prisma.run.findFirst({
        where: {
          OR: [
            { userId, date: runDate, distanceKm },
            { strava_activity_id: activityId },
          ],
        },
      })

      if (existing) {
        skipped++
        continue
      }

      const durationSec = act.moving_time
      const paceSecPerKm = distanceKm > 0 ? Math.round(durationSec / distanceKm) : 0

      await prisma.run.create({
        data: {
          userId,
          distanceKm,
          date: runDate,
          durationSec,
          paceSecPerKm,
          avgHeartRate: act.average_heartrate ? Math.round(act.average_heartrate) : null,
          notes: act.name || null,
          source: 'strava',
          strava_activity_id: activityId,
        },
      })

      synced++
    }

    await prisma.user.update({
      where: { id: userId },
      data: { last_synced_at: new Date() },
    })

    return {
      userId,
      name: user.name || 'Runner',
      synced,
      skipped,
    }
  } catch (err: any) {
    return {
      userId,
      name: user.name || 'Runner',
      synced: 0,
      skipped: 0,
      error: err.message || 'Sync failed',
    }
  }
}

/**
 * Syncs Strava runs for all connected runners in the community.
 */
export async function syncAllConnectedRunners(): Promise<{
  totalRunners: number
  totalSynced: number
  results: SyncRunnerResult[]
}> {
  const connectedUsers = await prisma.user.findMany({
    where: { strava_connected: true },
    select: { id: true, name: true },
  })

  const results: SyncRunnerResult[] = []
  let totalSynced = 0

  for (const user of connectedUsers) {
    const res = await syncRunnerActivities(user.id)
    results.push(res)
    totalSynced += res.synced
    // Small delay between calls to be respectful of Strava rate limits
    await new Promise((resolve) => setTimeout(resolve, 300))
  }

  return {
    totalRunners: connectedUsers.length,
    totalSynced,
    results,
  }
}
