import { NextResponse } from 'next/server'
import { syncAllConnectedRunners } from '../../../../lib/strava-sync-service'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const url = new URL(req.url)
      const querySecret = url.searchParams.get('secret')
      const adminPass = process.env.ADMIN_PASSWORD || 'runclub2026'
      if (querySecret !== cronSecret && querySecret !== adminPass) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log('[Cron] Starting scheduled Strava sync for all runners...')
    const result = await syncAllConnectedRunners()
    console.log(`[Cron] Completed sync: ${result.totalSynced} new runs across ${result.totalRunners} runners.`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (error: any) {
    console.error('[Cron] Strava sync failed:', error)
    return NextResponse.json(
      { error: error.message || 'Scheduled sync failed' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  return GET(req)
}
