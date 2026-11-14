import { generateGeminiText, getGeminiApiKey } from './gemini'
import type { RunnerProfile, TrainingPlanOutput } from './training-engine'

type PersonalizedWeek = {
  weekNumber: number
  focus: string
  workouts: Array<{
    dayOfWeek: string
    purpose: string
    instructions: string[]
  }>
}

function parsePersonalization(text: string, plan: TrainingPlanOutput): PersonalizedWeek[] | null {
  try {
    const parsed = JSON.parse(text) as { weeks?: unknown }
    if (!Array.isArray(parsed.weeks) || parsed.weeks.length !== plan.weeks.length) return null

    const weeks: PersonalizedWeek[] = []
    for (const plannedWeek of plan.weeks) {
      const candidate = parsed.weeks.find((week: any) => week?.weekNumber === plannedWeek.weekNumber)
      if (!candidate || typeof candidate.focus !== 'string' || !Array.isArray(candidate.workouts)) return null
      if (candidate.focus.length > 400 || candidate.workouts.length !== plannedWeek.workouts.length) return null

      const workouts: PersonalizedWeek['workouts'] = []
      for (const plannedWorkout of plannedWeek.workouts) {
        const candidateWorkout = candidate.workouts.find((workout: any) => workout?.dayOfWeek === plannedWorkout.dayOfWeek)
        if (!candidateWorkout || typeof candidateWorkout.purpose !== 'string' || !Array.isArray(candidateWorkout.instructions)) return null
        if (candidateWorkout.purpose.length > 240 || candidateWorkout.instructions.length > 5) return null
        if (candidateWorkout.instructions.some((instruction: unknown) => typeof instruction !== 'string' || instruction.length > 240)) return null

        workouts.push({
          dayOfWeek: plannedWorkout.dayOfWeek,
          purpose: candidateWorkout.purpose,
          instructions: candidateWorkout.instructions,
        })
      }
      weeks.push({ weekNumber: plannedWeek.weekNumber, focus: candidate.focus, workouts })
    }
    return weeks
  } catch {
    return null
  }
}

export async function personalizeTrainingPlan(
  plan: TrainingPlanOutput,
  profile: RunnerProfile,
): Promise<TrainingPlanOutput & { aiPersonalized: boolean }> {
  if (!getGeminiApiKey()) return { ...plan, aiPersonalized: false }

  const schedule = plan.weeks.map((week) => ({
    weekNumber: week.weekNumber,
    weekType: week.weekType,
    totalKmTarget: week.totalKmTarget,
    workouts: week.workouts.map(({ dayOfWeek, type, distanceKm, durationMin }) => ({
      dayOfWeek,
      type,
      distanceKm,
      durationMin,
    })),
  }))

  try {
    const text = await generateGeminiText({
      systemInstruction: [
        'You are a cautious, evidence-informed running coach. Personalize only the written coaching notes for the supplied schedule.',
        'The schedule is authoritative: never add, remove, move, or change workouts, distances, durations, intensities, pace targets, or recovery weeks.',
        'Do not diagnose injuries or prescribe treatment. If an injury is reported, emphasize stopping if pain worsens and consulting a qualified clinician.',
        'Return only valid JSON with shape {"weeks":[{"weekNumber":number,"focus":string,"workouts":[{"dayOfWeek":string,"purpose":string,"instructions":string[]}]}]}.',
        'Include exactly the supplied weeks and workouts, preserving each weekNumber and dayOfWeek. Keep each focus to 1-2 concise sentences and each workout to at most 3 short instructions.',
      ].join(' '),
      prompt: JSON.stringify({
        runner: {
          goalRace: profile.goalRace,
          goalTimeSec: profile.goalTimeSec,
          weeksTotal: plan.weeksTotal,
          currentWeeklyKm: profile.currentWeeklyKm,
          currentPaceSec: profile.currentPaceSec,
          daysPerWeek: profile.daysPerWeek,
          hasStrengthDays: profile.hasStrengthDays,
          prefersWalkRun: profile.prefersWalkRun,
          currentInjury: profile.currentInjury,
          yearsRunning: profile.yearsRunning,
          longestRecentKm: profile.longestRecentKm,
        },
        schedule,
      }),
      temperature: 0.3,
      maxOutputTokens: 6000,
      responseMimeType: 'application/json',
    })
    const weeks = parsePersonalization(text, plan)
    if (!weeks) return { ...plan, aiPersonalized: false }

    return {
      ...plan,
      aiPersonalized: true,
      weeks: plan.weeks.map((week) => {
        const personalizedWeek = weeks.find((item) => item.weekNumber === week.weekNumber)!
        return {
          ...week,
          weekFocus: personalizedWeek.focus,
          workouts: week.workouts.map((workout) => {
            const personalizedWorkout = personalizedWeek.workouts.find((item) => item.dayOfWeek === workout.dayOfWeek)!
            return {
              ...workout,
              purpose: personalizedWorkout.purpose,
              instructions: personalizedWorkout.instructions,
            }
          }),
        }
      }),
    }
  } catch (error) {
    console.warn('[AI training plan] personalization unavailable; using the safe rules-based plan:', error)
    return { ...plan, aiPersonalized: false }
  }
}
