/**
 * GET /api/progress
 *
 * Returns every participant's training progress vs their assigned plan.
 * Used by the dashboard to render progress cards, leaderboard, etc.
 *
 * Response shape:
 * {
 *   generatedAt: string (ISO),
 *   currentWeek: number (1-10, or 0 if not started),
 *   participants: ParticipantProgress[]
 * }
 */

import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import {
  PARTICIPANTS,
  getPlan,
  getWeekIdx,
  currentWeekIdx,
  plannedKmSoFar,
  getStatus,
  grandTotal,
  WEEK_STARTS,
} from '../../../lib/planData'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cwi = currentWeekIdx()

  // Fetch all runs grouped by user email
  const allUsers = await prisma.user.findMany({
    select: {
      email: true,
      runs: {
        select: { date: true, distanceKm: true, paceSecPerKm: true },
        orderBy: { date: 'desc' },
      },
    },
  })

const runsByEmail = new Map<
  string,
  { date: Date; distanceKm: number; paceSecPerKm: number | null }[]
>(
  allUsers.map((u: any) => [u.email, u.runs])
)

const result = PARTICIPANTS.map((p) => {
  const email = p.email || `placeholder_${p.id}@runclub.local`

  const runs =
    runsByEmail.get(email) ??
    ([] as {
      date: Date
      distanceKm: number
      paceSecPerKm: number | null
    }[])

  const plan = getPlan(p)

  const totalKm = runs.reduce(
    (s: number, r) => s + r.distanceKm,
    0
  )
    const plannedKm = plannedKmSoFar(p)
    const pct = plannedKm > 0 ? Math.min(100, Math.round((totalKm / plannedKm) * 100)) : 0
    const status = getStatus(totalKm, p)

    // Per-week breakdown
    const weeklyMap: Record<number, number> = {}
    for (const r of runs) {
      const wi = getWeekIdx(r.date)
      if (wi >= 0) weeklyMap[wi] = (weeklyMap[wi] ?? 0) + r.distanceKm
    }

    const weeks = plan.map((w, wi) => ({
      weekNum: wi + 1,
      label: w.label,
      planned: w.total,
      logged: parseFloat((weeklyMap[wi] ?? 0).toFixed(1)),
      isCurrent: wi === cwi,
      isFuture: wi > cwi,
      // per-day targets
      tue: w.tue,
      thu: w.thu,
      sat: w.sat,
      sun: w.sun,
    }))

    return {
      id: p.id,
      name: p.name,
      initials: p.initials,
      email: p.email,
      cat: p.cat,
      totalKm: parseFloat(totalKm.toFixed(1)),
      plannedKm: parseFloat(plannedKm.toFixed(1)),
      pct,
      status,         // 'green' | 'yellow' | 'red'
      runCount: runs.length,
      lastPace: runs[0]?.paceSecPerKm ?? null,
      grandTotal: grandTotal(p),
      weeks,
    }
  })

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    currentWeek: cwi >= 0 ? cwi + 1 : 0,
    participants: result,
  })
}
