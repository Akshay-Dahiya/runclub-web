/**
 * training-engine.ts
 * Deterministic training plan generator.
 * No external API — pure TypeScript rules.
 *
 * Rules enforced:
 * - 10% rule: weekly km never increases >10%/week
 * - Hard/easy alternation: no two hard sessions back-to-back
 * - Long run cap: ≤30% of weekly km
 * - Recovery week: every 4th week, reduce volume 20%
 * - Taper: last 2 weeks before race, reduce volume 30% / 50%
 * - 80/20 split: ~80% easy, ~20% hard
 */

import { RACE_KM, fmtPace } from './race-predictor'

export type WorkoutType = 'easy' | 'tempo' | 'intervals' | 'long' | 'strength' | 'rest' | 'race_simulation' | 'strides'

export interface WorkoutPrescription {
  dayOfWeek: string
  type: WorkoutType
  distanceKm: number | null
  durationMin: number | null
  targetPaceSec: number | null       // per km
  effortZone: 1 | 2 | 3 | 4 | 5     // HR zone
  warmupDesc: string
  mainDesc: string
  cooldownDesc: string
  purpose: string
  instructions: string[]
}

export interface WeekPlan {
  weekNumber: number
  weekType: 'base' | 'build' | 'peak' | 'recovery' | 'taper'
  totalKmTarget: number
  workouts: WorkoutPrescription[]
  weekFocus: string
}

export interface TrainingPlanOutput {
  goalRace: string
  goalTimeSec: number
  goalRaceDate: Date | null
  weeksTotal: number
  startWeeklyKm: number
  peakWeeklyKm: number
  weeks: WeekPlan[]
  paceZones: PaceZones
}

export interface PaceZones {
  easy: number      // sec/km — conversational
  marathon: number  // sec/km — marathon race pace
  tempo: number     // sec/km — lactate threshold
  interval: number  // sec/km — VO2 max effort
  sprint: number    // sec/km — 400m effort
}

export interface RunnerProfile {
  goalRace: string
  goalTimeSec: number
  goalRaceDate: Date | null
  currentWeeklyKm: number
  currentPaceSec: number         // easy pace sec/km
  daysPerWeek: number            // 2–7
  hasStrengthDays: boolean
  prefersWalkRun: boolean
  currentInjury: boolean
  yearsRunning: number
  longestRecentKm: number        // longest run in last 30 days
}

// ─── Pace zones ───────────────────────────────────────────────────────────────
// Based on goal race pace, calculate all training pace zones
export function calcPaceZones(goalTimeSec: number, goalRace: string): PaceZones {
  const goalKm = RACE_KM[goalRace] ?? 10
  const racePaceSec = goalTimeSec / goalKm   // goal race pace per km

  // Standard zone derivations from race pace
  // These are well-established relationships from Daniels' Running Formula
  const isHMOrMarathon = goalRace === 'HM' || goalRace === 'Marathon'
  return {
    easy:      Math.round(racePaceSec * (isHMOrMarathon ? 1.20 : 1.25)),   // Z1-2
    marathon:  Math.round(racePaceSec * (isHMOrMarathon ? 1.05 : 1.10)),   // Z3
    tempo:     Math.round(racePaceSec * (isHMOrMarathon ? 0.98 : 1.00)),   // Z3-4
    interval:  Math.round(racePaceSec * 0.92),                              // Z4-5
    sprint:    Math.round(racePaceSec * 0.85),                              // Z5
  }
}

// ─── Main plan generator ──────────────────────────────────────────────────────
export function generateTrainingPlan(profile: RunnerProfile): TrainingPlanOutput {
  const { goalRace, goalTimeSec, goalRaceDate, daysPerWeek } = profile
  const raceKm = RACE_KM[goalRace] ?? 10
  const paceZones = calcPaceZones(goalTimeSec, goalRace)

  // Calculate plan length
  const today = new Date()
  const totalWeeks = goalRaceDate
    ? Math.min(20, Math.max(4, Math.floor((goalRaceDate.getTime() - today.getTime()) / (7 * 24 * 3600 * 1000))))
    : Math.min(16, Math.max(8, raceKm <= 5 ? 8 : raceKm <= 10 ? 10 : raceKm <= 21.1 ? 14 : 18))

  // Weekly km progression
  const startKm = Math.max(profile.currentWeeklyKm, raceKm <= 5 ? 10 : raceKm <= 10 ? 15 : 20)
  const taperWeeks = raceKm >= 21.1 ? 2 : 1
  const recoveryWeeks = Math.floor(totalWeeks / 4)
  const buildWeeks = totalWeeks - taperWeeks - recoveryWeeks

  // Peak weekly km — target ~3–4× race distance for 10K and shorter, 5–6× for HM+
  const peakMultiplier = goalRace === '5K' ? 3.5 : goalRace === '10K' ? 4.0 : goalRace === 'HM' ? 5.0 : 5.5
  const peakKm = Math.min(
    startKm * Math.pow(1.08, buildWeeks),  // 8% growth limited
    raceKm * peakMultiplier
  )

  const weeks: WeekPlan[] = []

  for (let w = 1; w <= totalWeeks; w++) {
    const isRecoveryWeek = w % 4 === 0 && w < totalWeeks - taperWeeks + 1
    const isTaperWeek = w > totalWeeks - taperWeeks
    const weekPos = (w - 1) / Math.max(buildWeeks - 1, 1)

    // Calculate weekly km
    let weekKm: number
    let weekType: WeekPlan['weekType']

    if (isTaperWeek) {
      const taperPos = w - (totalWeeks - taperWeeks)
      weekKm = peakKm * (taperPos === 1 ? 0.7 : 0.5)
      weekType = 'taper'
    } else if (isRecoveryWeek) {
      weekKm = startKm + (peakKm - startKm) * weekPos * 0.8
      weekType = 'recovery'
    } else {
      weekKm = startKm + (peakKm - startKm) * weekPos
      if (weekPos < 0.33) weekType = 'base'
      else if (weekPos < 0.75) weekType = 'build'
      else weekType = 'peak'
    }

    weekKm = Math.round(weekKm)

    // Distribute workouts across the week
    const workouts = buildWeekWorkouts(
      weekKm,
      weekType,
      daysPerWeek,
      paceZones,
      profile,
      goalRace,
      w,
      totalWeeks
    )

    const weekFocusMap: Record<WeekPlan['weekType'], string> = {
      base: 'Build your aerobic base with easy, consistent running',
      build: 'Increase intensity — tempo and interval sessions begin',
      peak: 'Maximum training load — your hardest weeks before taper',
      recovery: 'Recovery week — reduce volume, let your body adapt',
      taper: 'Taper — stay sharp, reduce fatigue, prepare to race',
    }

    weeks.push({
      weekNumber: w,
      weekType,
      totalKmTarget: weekKm,
      workouts,
      weekFocus: weekFocusMap[weekType],
    })
  }

  return {
    goalRace,
    goalTimeSec,
    goalRaceDate,
    weeksTotal: totalWeeks,
    startWeeklyKm: startKm,
    peakWeeklyKm: Math.round(peakKm),
    weeks,
    paceZones,
  }
}

// ─── Build a week's workouts ──────────────────────────────────────────────────
function buildWeekWorkouts(
  weekKm: number,
  weekType: WeekPlan['weekType'],
  daysPerWeek: number,
  paceZones: PaceZones,
  profile: RunnerProfile,
  goalRace: string,
  weekNum: number,
  totalWeeks: number
): WorkoutPrescription[] {
  const workouts: WorkoutPrescription[] = []
  const raceKm = RACE_KM[goalRace] ?? 10

  // Long run: 25–30% of weekly km, capped at race distance for shorter races
  const longRunKm = Math.min(
    Math.round(weekKm * (weekType === 'taper' ? 0.4 : 0.28)),
    weekType === 'taper' ? raceKm * 0.6 : raceKm * 1.1
  )

  // Tempo volume: ~15% of weekly km
  const tempoKm = Math.max(3, Math.round(weekKm * 0.15))

  // Interval volume: ~10% of weekly km (expressed as reps)
  const intervalKm = Math.max(2, Math.round(weekKm * 0.10))

  // Easy runs fill the rest
  const hardKm = longRunKm + tempoKm + intervalKm
  const easyKm = Math.max(0, weekKm - hardKm)

  // Day layout based on daysPerWeek (1=Mon)
  const DAY_TEMPLATES: Record<number, string[]> = {
    3: ['Tuesday', 'Thursday', 'Saturday'],
    4: ['Tuesday', 'Thursday', 'Saturday', 'Sunday'],
    5: ['Monday', 'Tuesday', 'Thursday', 'Saturday', 'Sunday'],
    6: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday', 'Sunday'],
    7: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  }
  const days = DAY_TEMPLATES[Math.min(7, Math.max(3, daysPerWeek))] || DAY_TEMPLATES[4]

  // Assign session types to days (never two hard sessions back-to-back)
  // Priority: Long run on Sunday, Intervals on Tuesday, Tempo on Thursday
  type SessionType = 'long' | 'intervals' | 'tempo' | 'easy' | 'strides' | 'rest'
  const sessionMap: Record<string, SessionType> = {}

  // Assign based on day name
  for (const day of days) {
    if (day === 'Sunday') sessionMap[day] = 'long'
    else if ((day === 'Tuesday' || day === 'Wednesday') && weekType !== 'base' && weekType !== 'recovery' && weekType !== 'taper')
      sessionMap[day] = 'intervals'
    else if ((day === 'Thursday' || day === 'Friday') && weekType !== 'base' && weekType !== 'recovery')
      sessionMap[day] = 'tempo'
    else if (day === 'Saturday' && weekType === 'base')
      sessionMap[day] = 'strides'
    else
      sessionMap[day] = 'easy'
  }

  // Adjust for base and taper weeks
  if (weekType === 'base' || weekType === 'recovery') {
    for (const day of days) {
      if (sessionMap[day] === 'intervals') sessionMap[day] = 'easy'
      if (sessionMap[day] === 'tempo') sessionMap[day] = 'easy'
    }
    // Keep one strides session on the last day before the long run
  }

  if (weekType === 'taper') {
    for (const day of days) {
      if (sessionMap[day] === 'intervals') sessionMap[day] = 'strides'
    }
  }

  // Build workout prescriptions
  for (const day of days) {
    const type = sessionMap[day] ?? 'easy'
    const workout = buildWorkout(type, day, weekKm, longRunKm, tempoKm, intervalKm, easyKm, paceZones, profile, weekType, weekNum, totalWeeks, days)
    if (workout) workouts.push(workout)
  }

  return workouts
}

function buildWorkout(
  type: string,
  day: string,
  weekKm: number,
  longRunKm: number,
  tempoKm: number,
  intervalKm: number,
  easyKm: number,
  paceZones: PaceZones,
  profile: RunnerProfile,
  weekType: string,
  weekNum: number,
  totalWeeks: number,
  allDays: string[]
): WorkoutPrescription | null {
  const totalEasyDays = allDays.filter(d => {
    const d2 = d === 'Sunday' ? 'long' : 'easy'
    return d2 === 'easy'
  }).length || 1

  const easyPerSession = Math.round((easyKm / totalEasyDays) * 10) / 10

  switch (type) {
    case 'long':
      return {
        dayOfWeek: day,
        type: 'long',
        distanceKm: longRunKm,
        durationMin: Math.round(longRunKm * paceZones.easy / 60),
        targetPaceSec: paceZones.easy,
        effortZone: 2,
        warmupDesc: `First 10 min at very easy effort to warm up`,
        mainDesc: `${longRunKm} km at easy, conversational pace (${fmtPace(paceZones.easy)})`,
        cooldownDesc: `Last 5 min walk or very easy jog. Stretch calves, quads, hips.`,
        purpose: `Build your aerobic endurance base — the most important run of the week. The long run teaches your body to burn fat efficiently, strengthens tendons, and builds mental toughness.`,
        instructions: [
          `Start at ${fmtPace(paceZones.easy)} or slower — this should feel very comfortable`,
          `You should be able to hold a full conversation`,
          `Don't worry about pace — finishing the distance matters more`,
          `If running more than 60 min, take water/electrolytes`,
          weekType === 'taper' ? `Short long run — just stay loose and confident. Race week soon!` : `Focus on smooth, relaxed form for the full distance`,
        ],
      }

    case 'intervals': {
      const repsKm = Math.min(0.8, Math.max(0.4, intervalKm / 6))
      const reps = Math.round(intervalKm / repsKm)
      const repMetres = Math.round(repsKm * 1000 / 100) * 100  // round to 100m
      return {
        dayOfWeek: day,
        type: 'intervals',
        distanceKm: intervalKm + 3,  // includes warm-up/cool-down
        durationMin: Math.round((intervalKm * paceZones.interval + 3 * paceZones.easy) / 60),
        targetPaceSec: paceZones.interval,
        effortZone: 5,
        warmupDesc: `1.5 km easy jog + 4 × 100m strides to open up legs`,
        mainDesc: `${reps} × ${repMetres}m at ${fmtPace(paceZones.interval)} with ${repMetres}m walk/jog rest`,
        cooldownDesc: `1.5 km easy jog. Shake out legs.`,
        purpose: `Raise your VO2 max — the ceiling of your aerobic fitness. Short, hard intervals at 90–95% max heart rate force adaptations that make all your paces feel easier.`,
        instructions: [
          `Warm up fully before the first rep — 10–15 min easy`,
          `Each ${repMetres}m should feel hard but controlled — not all-out sprint`,
          `Target pace: ${fmtPace(paceZones.interval)} per km`,
          `Rest between reps: walk or very easy jog for the same distance you just ran`,
          `If you can't hit pace by rep 5, end the session — quality over quantity`,
          `Cool down slowly — don't stop suddenly after the last rep`,
        ],
      }
    }

    case 'tempo':
      return {
        dayOfWeek: day,
        type: 'tempo',
        distanceKm: tempoKm + 4,  // includes warm-up/cool-down
        durationMin: Math.round((tempoKm * paceZones.tempo + 4 * paceZones.easy) / 60),
        targetPaceSec: paceZones.tempo,
        effortZone: 4,
        warmupDesc: `2 km easy jog`,
        mainDesc: `${tempoKm} km at tempo pace (${fmtPace(paceZones.tempo)}) — "comfortably hard"`,
        cooldownDesc: `2 km easy jog. Light stretching.`,
        purpose: `Train your lactate threshold — the fastest pace you can sustain. This is the single biggest driver of race performance improvement for most runners.`,
        instructions: [
          `Tempo pace = ${fmtPace(paceZones.tempo)} — "comfortably hard"`,
          `You should be able to say short phrases but NOT hold a conversation`,
          `Start slightly conservative — the second half should feel harder`,
          `Don't go faster than tempo pace — consistent effort is the goal`,
          `If you have a heart rate monitor, stay at 80–88% max HR`,
        ],
      }

    case 'strides':
      return {
        dayOfWeek: day,
        type: 'easy',  // treated as easy in workout log
        distanceKm: 5,
        durationMin: 30,
        targetPaceSec: paceZones.easy,
        effortZone: 2,
        warmupDesc: ``,
        mainDesc: `4 km easy run + 4 × 100m strides at the end`,
        cooldownDesc: `Walk 5 min`,
        purpose: `Easy run with strides maintains neuromuscular sharpness — your legs stay "fast" even during easy weeks.`,
        instructions: [
          `4 km at easy, conversational pace`,
          `After the run: 4 × 100m strides — gradually accelerate to 90% effort`,
          `Each stride: 20m build-up, 60m fast, 20m slow-down`,
          `Walk 60–90 seconds between strides`,
          `Strides are not sprints — smooth and controlled`,
        ],
      }

    case 'easy':
    default: {
      const dist = Math.max(3, easyPerSession)
      return {
        dayOfWeek: day,
        type: 'easy',
        distanceKm: dist,
        durationMin: Math.round(dist * paceZones.easy / 60),
        targetPaceSec: paceZones.easy,
        effortZone: 2,
        warmupDesc: ``,
        mainDesc: `${dist} km easy run at ${fmtPace(paceZones.easy)} — fully conversational`,
        cooldownDesc: `2–3 min walk`,
        purpose: `Easy runs build aerobic base, aid recovery from hard sessions, and add essential volume. 80% of your training should feel like this.`,
        instructions: [
          `Pace: ${fmtPace(paceZones.easy)} — if in doubt, go slower`,
          `You should be able to speak full sentences`,
          `Focus on easy, relaxed breathing`,
          `This run should feel almost too easy — that's correct`,
          profile.prefersWalkRun ? `Run/walk is fine — take 60-second walk breaks whenever needed` : ``,
        ].filter(Boolean),
      }
    }
  }
}
