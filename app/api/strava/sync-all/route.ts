import { NextResponse } from 'next/server'
import { syncAllConnectedRunners } from '../../../../lib/strava-sync-service'
import { createRateLimiter, getIP } from '../../../../lib/rateLimit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Allow max 10 sync-all requests per 10 minutes per IP
const syncAllLimiter = createRateLimiter(10 * 60 * 1000, 10)

export async function POST(req: Request) {
  try {
    const ip = getIP(req)
    const rateCheck = syncAllLimiter.check(ip)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Sync was requested recently. Please wait a minute before syncing again.' },
        { status: 429 }
      )
    }

    console.log('[Sync All] Manual community sync triggered...')
    const result = await syncAllConnectedRunners()
    console.log(`[Sync All] Synced ${result.totalSynced} runs across ${result.totalRunners} runners.`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (error: any) {
    console.error('[Sync All] Community sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync runs' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  return POST(req)
}
