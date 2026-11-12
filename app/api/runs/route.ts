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
import { getCurrentRunner } from '../../../lib/auth/runner'
import { prisma, hasDatabaseConfig } from '../../../lib/prisma'
import { getWeekIdx, WEEK_STARTS, PLAN_10K, PARTICIPANTS } from '../../../lib/planData'
import { createRateLimiter, getIP } from '../../../lib/rateLimit'

export const dynamic = 'force-dynamic'

// Rate limit: max 20 run submissions per IP per 15 minutes
const postLimiter = createRateLimiter(15 * 60 * 1000, 20)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  if (!hasDatabaseConfig()) return NextResponse.json([])

  const runner = await getCurrentRunner()
  const isOwner = runner?.id === userId
  const runs = await prisma.run.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 200,
    select: {
      id: true,
      userId: true,
      date: true,
      distanceKm: true,
      durationSec: true,
      paceSecPerKm: true,
      avgHeartRate: isOwner,
      notes: isOwner,
      source: true,
      createdAt: true,
    },
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

  const runner = await getCurrentRunner()
  if (!runner) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  const body = await req.json()
  if (body.userId && body.userId !== runner.id) {
    return NextResponse.json({ error: 'Runner profile not found' }, { status: 404 })
  }

  // The signed-in runner is always the owner; never trust a client-selected ID.
  const userId = runner.id
  const { date, distanceKm, paceSecPerKm } = body
  if (!date || distanceKm === undefined || distanceKm === null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Input validation
  const dist = Number(distanceKm)
  if (!Number.isFinite(dist) || dist <= 0 || dist > 100) {
    return NextResponse.json({ error: 'Distance must be between 0.01 and 100 km' }, { status: 400 })
  }

  const runDate = new Date(date)
  if (isNaN(runDate.getTime()) || runDate > new Date()) {
    return NextResponse.json({ error: 'Invalid or future date' }, { status: 400 })
  }

  const normalizedPace = paceSecPerKm == null ? null : Number(paceSecPerKm)
  if (normalizedPace !== null && (!Number.isInteger(normalizedPace) || normalizedPace < 120 || normalizedPace > 1200)) {
    return NextResponse.json({ error: 'Pace must be reasonable (2:00–20:00/km)' }, { status: 400 })
  }

  const normalizedDuration = body.durationSec == null ? null : Number(body.durationSec)
  if (normalizedDuration !== null && (!Number.isInteger(normalizedDuration) || normalizedDuration < 1 || normalizedDuration > 86400)) {
    return NextResponse.json({ error: 'Duration must be between 1 second and 24 hours' }, { status: 400 })
  }

  if (body.avgHeartRate != null && (!Number.isInteger(body.avgHeartRate) || body.avgHeartRate < 40 || body.avgHeartRate > 240)) {
    return NextResponse.json({ error: 'Invalid heart rate' }, { status: 400 })
  }
  if (body.notes != null && (typeof body.notes !== 'string' || body.notes.length > 500)) {
    return NextResponse.json({ error: 'Notes must be 500 characters or fewer' }, { status: 400 })
  }

  // Look up the signed-in user's profile for dashboard categorization.
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'Runner profile not found' }, { status: 404 })

  const participant = PARTICIPANTS.find(
    (p) => (p.email || `placeholder_${p.id}@runclub.local`) === user.email
  )

  // Calculate pace if not provided
  const durationSec = normalizedDuration ?? Math.round(dist * (normalizedPace ?? 360))
  const finalPace = normalizedPace ?? Math.round(durationSec / dist)

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
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  if (!session.isAdmin) {
    const runner = await getCurrentRunner()
    if (!runner) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    const ownedRun = await prisma.run.findFirst({ where: { id, userId: runner.id }, select: { id: true } })
    if (!ownedRun) return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  }

  await prisma.run.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
