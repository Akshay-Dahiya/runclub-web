import { NextResponse } from 'next/server'
import { getCurrentRunner } from '../../../../lib/auth/runner'
import { prisma } from '../../../../lib/prisma'
import { generateTrainingPlan } from '../../../../lib/training-engine'
import { personalizeTrainingPlan } from '../../../../lib/ai-training-plan'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function validId(val: unknown): string | null {
  if (typeof val !== 'string') return null
  const t = val.trim()
  return /^[a-zA-Z0-9_-]{1,64}$/.test(t) ? t : null
}

export async function GET(req: Request) {
  try {
    const runner = await getCurrentRunner().catch(() => null)
    const { searchParams } = new URL(req.url)
    const requestedUserId = validId(searchParams.get('userId'))
    const planId = validId(searchParams.get('planId'))

    if (runner && requestedUserId && requestedUserId !== runner.id) {
      return NextResponse.json({ error: 'Training plan not found' }, { status: 404 })
    }
    const userId = runner?.id || requestedUserId
    if (!userId) return NextResponse.json({ error: 'Connect Strava to continue' }, { status: 401 })

    let plan = null
    if (planId) {
      plan = await prisma.trainingPlan.findFirst({
        where: { id: planId, userId },
        include: { weeklyReviews: true },
      })
    } else if (userId) {
      plan = await prisma.trainingPlan.findFirst({
        where: { userId, status: 'active' },
        orderBy: { createdAt: 'desc' },
        include: { weeklyReviews: true },
      })
    }

    return NextResponse.json({ plan })
  } catch (error: any) {
    console.error('Coach plan GET error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch plan' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const runner = await getCurrentRunner().catch(() => null)
    const body = await req.json()
    const bodyUserId = validId(body?.userId)

    if (runner && bodyUserId && bodyUserId !== runner.id) {
      return NextResponse.json({ error: 'Training plan not found' }, { status: 404 })
    }
    const userId = runner?.id || bodyUserId
    if (!userId) return NextResponse.json({ error: 'Connect Strava to continue' }, { status: 401 })

    const { goalRace, goalTimeSec, goalRaceDate, daysPerWeek } = body

    if (!goalRace || !goalTimeSec) {
      return NextResponse.json({ error: 'Missing required plan parameters' }, { status: 400 })
    }

    const profile = await prisma.coachProfile.findUnique({
      where: { userId },
    })

    const runnerProfile = {
      goalRace,
      goalTimeSec,
      goalRaceDate: goalRaceDate ? new Date(goalRaceDate) : (profile?.goalRaceDate || null),
      currentWeeklyKm: profile?.weeklyKmCurrent || 20,
      currentPaceSec: profile?.easyPaceSec || 360,
      daysPerWeek: daysPerWeek || profile?.daysPerWeek || 4,
      hasStrengthDays: (profile?.strengthDays || 0) > 0,
      prefersWalkRun: profile?.prefersWalkRun || false,
      currentInjury: Boolean(profile?.currentInjury),
      yearsRunning: profile?.yearsRunning || 1,
      longestRecentKm: profile?.longestLast30 || 10,
    }
    const generated = await personalizeTrainingPlan(generateTrainingPlan(runnerProfile), runnerProfile)

    // Archive old active plans
    await prisma.trainingPlan.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'archived' },
    })

    const plan = await prisma.trainingPlan.create({
      data: {
        userId,
        goalRace,
        goalTimeSec,
        goalRaceDate: goalRaceDate ? new Date(goalRaceDate) : (profile?.goalRaceDate || null),
        weeksTotal: generated.weeksTotal,
        currentWeek: 1,
        status: 'active',
        planData: generated as any,
      },
    })

    // Update profile with active plan
    await prisma.coachProfile.upsert({
      where: { userId },
      update: {
        activePlanId: plan.id,
        goalRace,
        goalTimeSec,
        goalRaceDate: goalRaceDate ? new Date(goalRaceDate) : undefined,
      },
      create: {
        userId,
        activePlanId: plan.id,
        goalRace,
        goalTimeSec,
        goalRaceDate: goalRaceDate ? new Date(goalRaceDate) : undefined,
      },
    })

    return NextResponse.json({ plan })
  } catch (error: any) {
    console.error('Coach plan POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate plan' }, { status: 500 })
  }
}

// PATCH allows marking workouts done, adjusting RPE, or updating plan progress
export async function PATCH(req: Request) {
  try {
    const runner = await getCurrentRunner().catch(() => null)
    const body = await req.json()
    const { planId, weekNumber, dayOfWeek, status, perceivedEffort, runnerNotes } = body
    const bodyUserId = validId(body?.userId)

    if (runner && bodyUserId && bodyUserId !== runner.id) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }
    const targetUserId = runner?.id || bodyUserId
    if (!targetUserId) {
      return NextResponse.json({ error: 'Connect Strava to continue' }, { status: 401 })
    }

    if (!planId) {
      return NextResponse.json({ error: 'Missing planId' }, { status: 400 })
    }

    const plan = await prisma.trainingPlan.findFirst({
      where: { id: planId, userId: targetUserId },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const planData = plan.planData as any
    if (planData && Array.isArray(planData.weeks)) {
      const targetWeek = planData.weeks.find((w: any) => w.weekNumber === weekNumber)
      if (targetWeek && Array.isArray(targetWeek.workouts)) {
        const targetWorkout = targetWeek.workouts.find((wo: any) => wo.dayOfWeek === dayOfWeek)
        if (targetWorkout) {
          if (status) targetWorkout.status = status
          if (perceivedEffort !== undefined) targetWorkout.perceivedEffort = perceivedEffort
          if (runnerNotes !== undefined) targetWorkout.runnerNotes = runnerNotes
        }
      }

      const updated = await prisma.trainingPlan.update({
        where: { id: planId },
        data: { planData },
      })
      return NextResponse.json({ plan: updated })
    }

    return NextResponse.json({ plan })
  } catch (error: any) {
    console.error('Coach plan PATCH error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update workout status' }, { status: 500 })
  }
}
