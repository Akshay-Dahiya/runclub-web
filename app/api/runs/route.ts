/**
 * /api/runs — CRUD for runs
 *
 * GET    ?userId=<id>   → all runs for a user (desc date)
 * POST                  → log a new run (rate-limited)
 * DELETE ?id=<runId>    → remove a run (admin only)
 */

import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '../../../lib/session'
import { cookies } from 'next/headers'
import { prisma } from '../../../lib/prisma'
import { getWeekIdx, WEEK_STARTS, PLAN_10K, PARTICIPANTS } from '../../../lib/planData'
import { createRateLimiter, getIP } from '../../../lib/rateLimit'

export const dynamic = 'force-dynamic'

// Rate limit: max 20 run submissions per IP per 15 minutes
const postLimiter = createRateLimiter(15 * 60 * 1000, 20)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const runs = await prisma.run.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { date: 'desc' },
    take: 200,
  })
  return NextResponse.json(runs)
}

export async function POST(req: Request) {
  // Rate limiting
  const ip = getIP(req)
  const rateCheck = postLimiter.check(ip)
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  const body = await req.json()

  // body expected: { userId, date, distanceKm, paceSecPerKm? }
  const { userId, date, distanceKm, paceSecPerKm } = body
  if (!userId || !date || !distanceKm) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Input validation
  const dist = parseFloat(distanceKm)
  if (!dist || dist <= 0 || dist > 100) {
    return NextResponse.json({ error: 'Distance must be between 0.01 and 100 km' }, { status: 400 })
  }

  const runDate = new Date(date)
  if (isNaN(runDate.getTime()) || runDate > new Date()) {
    return NextResponse.json({ error: 'Invalid or future date' }, { status: 400 })
  }

  if (paceSecPerKm && (paceSecPerKm < 120 || paceSecPerKm > 1200)) {
    return NextResponse.json({ error: 'Pace must be reasonable (2:00–20:00/km)' }, { status: 400 })
  }

  // Look up the user to get their plan category
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const participant = PARTICIPANTS.find(
    (p) => (p.email || `placeholder_${p.id}@runclub.local`) === user.email
  )

  // Calculate pace if not provided
  const durationSec = body.durationSec ?? Math.round(dist * (paceSecPerKm ?? 360))
  const finalPace = paceSecPerKm ?? Math.round(durationSec / dist)

  // Deduplication safeguard
  const thirtySecondsAgo = new Date(Date.now() - 30 * 1000)
  const recentDuplicate = await prisma.run.findFirst({
    where: {
      userId: userId,
      distanceKm: dist,
      date: runDate,
      createdAt: {
        gte: thirtySecondsAgo
      }
    }
  })
  
  if (recentDuplicate) {
    return NextResponse.json({ error: 'This run looks like a duplicate. It was not saved again.' }, { status: 409 })
  }

  const run = await prisma.run.create({
    data: {
      userId,
      date: runDate,
      distanceKm: dist,
      durationSec,
      paceSecPerKm: finalPace,
      avgHeartRate: body.avgHeartRate ?? null,
      notes: body.notes ?? null,
    },
  })

  // Attach which plan week this fell in (stored in notes if not already set)
  const wi = getWeekIdx(runDate)
  const weekLabel = wi >= 0 ? `Week ${wi + 1}` : 'Outside plan'

  return NextResponse.json({ ...run, weekLabel })
}

export async function DELETE(req: Request) {
  // SECURITY: Only admins can delete runs
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized — admin login required' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await prisma.run.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
