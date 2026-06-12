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

  // Fetch all runs grouped by user
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      initials: true,
      runningGoal: true,
      runs: {
        select: { date: true, distanceKm: true, paceSecPerKm: true },
        orderBy: { date: 'desc' },
      },
    },
  })

  const result = allUsers.map((u: any) => {
    const staticPart = PARTICIPANTS.find(p => p.email === u.email)
    const name = u.name || staticPart?.name || 'Unknown'
    const initials = u.initials || staticPart?.initials || name.split(' ').map((w: string) => w[0]).join('').toUpperCase()
    
    let cat = staticPart?.cat || '10K'
    if (u.runningGoal) {
      if (u.runningGoal === '10.5K Run' || u.runningGoal === '10K') cat = '10K'
      else if (u.runningGoal === '21.1K Half Marathon' || u.runningGoal === 'HM' || u.runningGoal === 'HM_BEG') cat = 'HM_BEG'
      else if (u.runningGoal === 'HM_INT' || u.runningGoal === 'HM Intermediate') cat = 'HM_INT'
    }

    const updatedP = {
      id: u.id,
      name,
      initials,
      email: u.email,
      cat
    }

    const runs = u.runs
    const plan = getPlan(updatedP)

    const totalKm = runs.reduce(
      (s: number, r: any) => s + r.distanceKm,
      0
    )
    const plannedKm = plannedKmSoFar(updatedP)
    const pct = plannedKm > 0 ? Math.min(100, Math.round((totalKm / plannedKm) * 100)) : 0
    const status = getStatus(totalKm, updatedP)

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
      tue: w.tue,
      thu: w.thu,
      sat: w.sat,
      sun: w.sun,
    }))

    return {
      id: updatedP.id,
      name: updatedP.name,
      initials: updatedP.initials,
      email: updatedP.email,
      cat: updatedP.cat,
      totalKm: parseFloat(totalKm.toFixed(1)),
      plannedKm: parseFloat(plannedKm.toFixed(1)),
      pct,
      status,         // 'green' | 'yellow' | 'red'
      runCount: runs.length,
      lastPace: runs[0]?.paceSecPerKm ?? null,
      grandTotal: grandTotal(updatedP),
      weeks,
    }
  })

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    currentWeek: cwi >= 0 ? cwi + 1 : 0,
    participants: result,
  })
}
