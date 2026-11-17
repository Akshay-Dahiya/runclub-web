import { NextResponse } from 'next/server'
import { syncRunnerActivities } from '../../../../../lib/strava-sync-service'
import { createRateLimiter, getIP } from '../../../../../lib/rateLimit'

export const dynamic = 'force-dynamic'

// Rate limit: max 10 sync requests per IP per 10 minutes
const syncLimiter = createRateLimiter(10 * 60 * 1000, 10)

export async function POST(req: Request, { params }: { params: Promise<{ member_id: string }> }) {
  try {
    const ip = getIP(req)
    const rateCheck = syncLimiter.check(ip)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many sync requests. Please try again in a moment.' },
        { status: 429 }
      )
    }

    const resolvedParams = await params
    const memberId = resolvedParams.member_id

    if (!memberId || memberId.length > 30 || !/^[a-z0-9]+$/i.test(memberId)) {
      return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 })
    }

    const result = await syncRunnerActivities(memberId)
    if (result.error && result.error.includes('Not connected')) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Sync activities route error:', err)
    return NextResponse.json({ error: err.message || 'Sync failed' }, { status: 500 })
  }
}

export async function GET(req: Request, ctx: any) {
  return POST(req, ctx)
}
