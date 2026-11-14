import { NextResponse } from 'next/server'
import { getCurrentRunner } from '../../../../lib/auth/runner'
import { prisma } from '../../../../lib/prisma'
import { generateTrainingPlan } from '../../../../lib/training-engine'
import { personalizeTrainingPlan } from '../../../../lib/ai-training-plan'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const runner = await getCurrentRunner()
    if (!runner) return NextResponse.json({ error: 'Connect Strava to continue' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const requestedUserId = searchParams.get('userId')
    if (requestedUserId && requestedUserId !== runner.id) {
      return NextResponse.json({ error: 'Runner profile not found' }, { status: 404 })
    }
    const userId = runner.id

    const profile = await prisma.coachProfile.findUnique({
      where: { userId },
    })

    const activePlan = await prisma.trainingPlan.findFirst({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
      include: { weeklyReviews: true },
    })

    return NextResponse.json({ profile, activePlan })
  } catch (error: any) {
    console.error('Coach onboarding GET error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch coach data' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const runner = await getCurrentRunner()
    if (!runner) return NextResponse.json({ error: 'Connect Strava to continue' }, { status: 401 })

    const body = await req.json()
    if (body.userId && body.userId !== runner.id) {
      return NextResponse.json({ error: 'Runner profile not found' }, { status: 404 })
    }
    const userId = runner.id
    const data = body

    // Upsert CoachProfile
    const profile = await prisma.coachProfile.upsert({
      where: { userId },
      update: {
        pb5kSec: data.pb5kSec ?? null,
        pb10kSec: data.pb10kSec ?? null,
        pbHMSec: data.pbHMSec ?? null,
        pbMarathonSec: data.pbMarathonSec ?? null,
        hasRacedBefore: Boolean(data.hasRacedBefore),
        lastRaceDate: data.lastRaceDate ? new Date(data.lastRaceDate) : null,
        weeklyKmCurrent: data.weeklyKmCurrent ? parseFloat(data.weeklyKmCurrent) : null,
        yearsRunning: data.yearsRunning ? parseFloat(data.yearsRunning) : null,

        daysPerWeek: data.daysPerWeek ? parseInt(data.daysPerWeek, 10) : 4,
        strengthDays: data.strengthDays ? parseInt(data.strengthDays, 10) : 0,
        hasGym: Boolean(data.hasGym),
        treadmillAccess: Boolean(data.treadmillAccess),
        outdoorAccess: data.outdoorAccess !== undefined ? Boolean(data.outdoorAccess) : true,
        sessionMinutes: data.sessionMinutes ? parseInt(data.sessionMinutes, 10) : 60,

        easyPaceSec: data.easyPaceSec ?? null,
        avgEasyKm: data.avgEasyKm ? parseFloat(data.avgEasyKm) : null,
        longestLast30: data.longestLast30 ? parseFloat(data.longestLast30) : null,
        hasHRMonitor: Boolean(data.hasHRMonitor),
        restingHR: data.restingHR ? parseInt(data.restingHR, 10) : null,

        currentInjury: data.currentInjury || null,
        recurringInjury: data.recurringInjury || null,
        prefersWalkRun: Boolean(data.prefersWalkRun),
        sleepHours: data.sleepHours ? parseFloat(data.sleepHours) : 7,

        goalRace: data.goalRace || '10K',
        goalRaceDate: data.goalRaceDate ? new Date(data.goalRaceDate) : null,
        goalTimeSec: data.goalTimeSec ?? null,
        isFirstRace: Boolean(data.isFirstRace),
        onboardingDone: true,
      },
      create: {
        userId,
        pb5kSec: data.pb5kSec ?? null,
        pb10kSec: data.pb10kSec ?? null,
        pbHMSec: data.pbHMSec ?? null,
        pbMarathonSec: data.pbMarathonSec ?? null,
        hasRacedBefore: Boolean(data.hasRacedBefore),
        lastRaceDate: data.lastRaceDate ? new Date(data.lastRaceDate) : null,
        weeklyKmCurrent: data.weeklyKmCurrent ? parseFloat(data.weeklyKmCurrent) : null,
        yearsRunning: data.yearsRunning ? parseFloat(data.yearsRunning) : null,

        daysPerWeek: data.daysPerWeek ? parseInt(data.daysPerWeek, 10) : 4,
        strengthDays: data.strengthDays ? parseInt(data.strengthDays, 10) : 0,
        hasGym: Boolean(data.hasGym),
        treadmillAccess: Boolean(data.treadmillAccess),
        outdoorAccess: data.outdoorAccess !== undefined ? Boolean(data.outdoorAccess) : true,
        sessionMinutes: data.sessionMinutes ? parseInt(data.sessionMinutes, 10) : 60,

        easyPaceSec: data.easyPaceSec ?? null,
        avgEasyKm: data.avgEasyKm ? parseFloat(data.avgEasyKm) : null,
        longestLast30: data.longestLast30 ? parseFloat(data.longestLast30) : null,
        hasHRMonitor: Boolean(data.hasHRMonitor),
        restingHR: data.restingHR ? parseInt(data.restingHR, 10) : null,

        currentInjury: data.currentInjury || null,
        recurringInjury: data.recurringInjury || null,
        prefersWalkRun: Boolean(data.prefersWalkRun),
        sleepHours: data.sleepHours ? parseFloat(data.sleepHours) : 7,

        goalRace: data.goalRace || '10K',
        goalRaceDate: data.goalRaceDate ? new Date(data.goalRaceDate) : null,
        goalTimeSec: data.goalTimeSec ?? null,
        isFirstRace: Boolean(data.isFirstRace),
        onboardingDone: true,
      },
    })

    // If goal time is provided, generate or update the training plan
    let plan = null
    if (data.goalRace && data.goalTimeSec) {
      const runnerProfile = {
        goalRace: data.goalRace,
        goalTimeSec: data.goalTimeSec,
        goalRaceDate: data.goalRaceDate ? new Date(data.goalRaceDate) : null,
        currentWeeklyKm: data.weeklyKmCurrent ? parseFloat(data.weeklyKmCurrent) : 20,
        currentPaceSec: data.easyPaceSec || 360, // default 6:00/km easy
        daysPerWeek: data.daysPerWeek ? parseInt(data.daysPerWeek, 10) : 4,
        hasStrengthDays: (data.strengthDays || 0) > 0,
        prefersWalkRun: Boolean(data.prefersWalkRun),
        currentInjury: Boolean(data.currentInjury),
        yearsRunning: data.yearsRunning ? parseFloat(data.yearsRunning) : 1,
        longestRecentKm: data.longestLast30 ? parseFloat(data.longestLast30) : 10,
      }
      const generated = await personalizeTrainingPlan(generateTrainingPlan(runnerProfile), runnerProfile)

      // Archive previous active plans
      await prisma.trainingPlan.updateMany({
        where: { userId, status: 'active' },
        data: { status: 'archived' },
      })

      plan = await prisma.trainingPlan.create({
        data: {
          userId,
          goalRace: data.goalRace,
          goalTimeSec: data.goalTimeSec,
          goalRaceDate: data.goalRaceDate ? new Date(data.goalRaceDate) : null,
          weeksTotal: generated.weeksTotal,
          currentWeek: 1,
          status: 'active',
          planData: generated as any,
        },
      })

      await prisma.coachProfile.update({
        where: { userId },
        data: { activePlanId: plan.id },
      })
    }

    return NextResponse.json({ profile, plan })
  } catch (error: any) {
    console.error('Coach onboarding POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to save onboarding data' }, { status: 500 })
  }
}
