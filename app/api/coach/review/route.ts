import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { fmtTime, fmtPace } from '../../../../lib/race-predictor'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const weekNumber = parseInt(searchParams.get('weekNumber') || '1', 10)

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const plan = await prisma.trainingPlan.findFirst({
      where: { userId, status: 'active' },
      include: {
        weeklyReviews: {
          where: { weekNumber },
        },
      },
    })

    if (!plan) {
      return NextResponse.json({ error: 'No active plan found' }, { status: 404 })
    }

    const existingReview = plan.weeklyReviews[0]
    if (existingReview) {
      return NextResponse.json({ review: existingReview })
    }

    // Generate review for this week
    const planData = plan.planData as any
    const weekObj = planData?.weeks?.find((w: any) => w.weekNumber === weekNumber) || planData?.weeks?.[0]
    const kmPlanned = weekObj ? weekObj.totalKmTarget : 25
    const workoutsPlanned = weekObj?.workouts?.length || 4

    // Fetch user's runs logged in this training week
    // Assume each week corresponds to a 7-day window from plan creation
    const planStart = new Date(plan.createdAt)
    const weekStart = new Date(planStart.getTime() + (weekNumber - 1) * 7 * 24 * 3600 * 1000)
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 3600 * 1000)

    const runs = await prisma.run.findMany({
      where: {
        userId,
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      orderBy: { date: 'asc' },
    })

    const kmCompleted = runs.reduce((sum: number, r: any) => sum + r.distanceKm, 0)
    const workoutsDone = runs.length
    const avgPaceSec = runs.length > 0
      ? Math.round(runs.reduce((sum: number, r: any) => sum + r.paceSecPerKm, 0) / runs.length)
      : null
    const avgHR = runs.filter((r: any) => r.avgHeartRate).length > 0
      ? Math.round(runs.filter((r: any) => r.avgHeartRate).reduce((sum: number, r: any) => sum + r.avgHeartRate, 0) / runs.filter((r: any) => r.avgHeartRate).length)
      : null

    // Generate AI Summary or deterministic narrative
    let aiSummary = ''
    let nextWeekFocus = ''

    const apiKey = process.env.OPENAI_API_KEY
    if (apiKey && apiKey !== 'mock' && apiKey !== 'demo') {
      try {
        const openai = createOpenAI({ apiKey })
        const prompt = `You are the RunClub Head Running Coach. Write a concise, motivational, highly specific Sunday Performance Review for a club runner.
Runner Goal: ${plan.goalRace} in target time ${fmtTime(plan.goalTimeSec)}.
Week ${weekNumber} Metrics:
- Planned Mileage: ${kmPlanned} km across ${workoutsPlanned} workouts.
- Completed: ${kmCompleted.toFixed(1)} km across ${workoutsDone} logged runs.
- Average Pace: ${avgPaceSec ? fmtPace(avgPaceSec) : 'N/A'}.
- Average Heart Rate: ${avgHR ? `${avgHR} bpm` : 'N/A'}.

Provide two parts:
1. SUMMARY: 2-3 sentences evaluating consistency, volume, and pacing discipline. Mention if they over-trained, hit the sweet spot, or fell short.
2. NEXT_WEEK_FOCUS: 1-2 actionable directives on what to adjust next week.`

        const { text } = await generateText({
          model: openai('gpt-4o-mini'),
          prompt,
        })

        aiSummary = text
        nextWeekFocus = `Focus on maintaining 80% easy effort. Prioritize your long run and protect recovery days.`
      } catch (aiErr) {
        console.warn('AI review generation fallback:', aiErr)
      }
    }

    if (!aiSummary) {
      // Deterministic evaluation fallback
      const completionPct = kmPlanned > 0 ? Math.round((kmCompleted / kmPlanned) * 100) : 0
      if (completionPct >= 90) {
        aiSummary = `Outstanding work this week! You completed ${kmCompleted.toFixed(1)} km (${completionPct}% of your ${kmPlanned} km target). Your consistency builds the aerobic foundation required to achieve your ${plan.goalRace} goal of ${fmtTime(plan.goalTimeSec)}.`
        nextWeekFocus = `Keep holding your easy runs at true recovery pace. Do not rush workouts — progressive adaptation is key.`
      } else if (completionPct >= 65) {
        aiSummary = `Solid week with ${kmCompleted.toFixed(1)} km logged (${completionPct}% of target). Life gets busy, but you stayed engaged. The key now is closing the consistency gap without cramming missed volume.`
        nextWeekFocus = `Do not add extra km to make up for missed sessions. Stick to the planned schedule next week with fresh legs.`
      } else {
        aiSummary = `You logged ${kmCompleted.toFixed(1)} km this week against a ${kmPlanned} km target. Consistency has been disrupted, which is completely normal. We will reset and rebuild step-by-step.`
        nextWeekFocus = `Simplify: Commit to just 3 runs next week. Focus on showing up for your easy runs first before worrying about speed.`
      }
    }

    const review = await prisma.weeklyReview.create({
      data: {
        planId: plan.id,
        userId,
        weekNumber,
        kmPlanned: parseFloat(kmPlanned.toString()),
        kmCompleted: parseFloat(kmCompleted.toFixed(2)),
        workoutsPlanned,
        workoutsDone,
        avgPaceSec,
        avgHR,
        aiSummary,
        nextWeekFocus,
      },
    })

    return NextResponse.json({ review })
  } catch (error: any) {
    console.error('Coach review error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate review' }, { status: 500 })
  }
}
