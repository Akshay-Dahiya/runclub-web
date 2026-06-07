/**
 * /api/runs — CRUD for runs
 *
 * GET    ?userId=<id>   → all runs for a user (desc date)
 * POST                  → log a new run
 * DELETE ?id=<runId>    → remove a run
 */

import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getWeekIdx, WEEK_STARTS, PLAN_10K, PLAN_HM, PARTICIPANTS } from '../../../lib/planData'

export const dynamic = 'force-dynamic'

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
  const body = await req.json()

  // body expected: { userId, date, distanceKm, paceSecPerKm? }
  const { userId, date, distanceKm, paceSecPerKm } = body
  if (!userId || !date || !distanceKm) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Look up the user to get their plan category
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const participant = PARTICIPANTS.find(
    (p) => (p.email || `placeholder_${p.id}@runclub.local`) === user.email
  )

  // Calculate pace if not provided
  const durationSec = body.durationSec ?? Math.round(distanceKm * (paceSecPerKm ?? 360))
  const finalPace = paceSecPerKm ?? Math.round(durationSec / distanceKm)

  const run = await prisma.run.create({
    data: {
      userId,
      date: new Date(date),
      distanceKm: parseFloat(distanceKm),
      durationSec,
      paceSecPerKm: finalPace,
      avgHeartRate: body.avgHeartRate ?? null,
      notes: body.notes ?? null,
    },
  })

  // Attach which plan week this fell in (stored in notes if not already set)
  const wi = getWeekIdx(new Date(date))
  const weekLabel = wi >= 0 ? `Week ${wi + 1}` : 'Outside plan'

  return NextResponse.json({ ...run, weekLabel })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await prisma.run.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
