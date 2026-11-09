import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { generateTrainingPlan } from '../../../../lib/training-engine'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const planId = searchParams.get('planId')

    if (!userId && !planId) {
      return NextResponse.json({ error: 'Missing userId or planId' }, { status: 400 })
    }

    let plan = null
    if (planId) {
      plan = await prisma.trainingPlan.findUnique({
        where: { id: planId },
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
    const body = await req.json()
    const { userId, goalRace, goalTimeSec, goalRaceDate, daysPerWeek } = body

    if (!userId || !goalRace || !goalTimeSec) {
      return NextResponse.json({ error: 'Missing required plan parameters' }, { status: 400 })
    }

    const profile = await prisma.coachProfile.findUnique({
      where: { userId },
    })

    const generated = generateTrainingPlan({
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
    })

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
    const body = await req.json()
    const { planId, weekNumber, dayOfWeek, status, perceivedEffort, runnerNotes } = body

    if (!planId) {
      return NextResponse.json({ error: 'Missing planId' }, { status: 400 })
    }

    const plan = await prisma.trainingPlan.findUnique({
      where: { id: planId },
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
