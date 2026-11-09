/**
 * goal-setter.ts
 * Deterministic goal feasibility engine.
 * No external API — pure TypeScript rules.
 *
 * Given a runner's current prediction and their goal:
 * - Is it achievable in the available time?
 * - What are the 3 goal tiers?
 * - What milestones do they need to hit?
 */

import { RACE_KM, fmtTime, fmtPace } from './race-predictor'

export interface GoalTier {
  label: 'Conservative' | 'Realistic' | 'Ambitious'
  timeSec: number
  paceSecPerKm: number
  description: string
  color: string
  emoji: string
  weeklyKmRequired: number
  feasibilityNote: string
}

export interface GoalAnalysis {
  raceName: string
  raceKm: number
  currentPredictedSec: number
  goalSec: number
  goalFeasibility: 'already_there' | 'achievable' | 'ambitious' | 'unrealistic'
  feasibilityMessage: string
  gapSec: number          // positive = need to improve
  gapPct: number          // % improvement needed
  weeksAvailable: number | null
  weeksNeeded: number     // our estimate of weeks needed to close gap
  tiers: GoalTier[]
  milestones: Milestone[]
  recommendedGoalTier: 'Conservative' | 'Realistic' | 'Ambitious'
}

export interface Milestone {
  week: number
  targetTimeSec: number
  targetPaceSec: number
  note: string
}

// Improvement rate assumption: ~1.5 seconds per km per week of consistent training
// (conservative, realistic for recreational runners)
const SEC_PER_KM_IMPROVEMENT_PER_WEEK = 1.5

export function analyseGoal(
  raceName: string,
  currentPredictedSec: number,
  goalTimeSec: number,
  raceDate: Date | null,
  currentWeeklyKm: number = 20
): GoalAnalysis {
  const raceKm = RACE_KM[raceName] ?? 10
  const today = new Date()

  const weeksAvailable = raceDate
    ? Math.max(0, Math.floor((raceDate.getTime() - today.getTime()) / (7 * 24 * 3600 * 1000)))
    : null

  const gapSec = currentPredictedSec - goalTimeSec        // positive = need to improve
  const gapPct = gapSec / currentPredictedSec

  // How many weeks does it realistically take to close this gap?
  const paceGapSecPerKm = gapSec / raceKm
  const weeksNeeded = Math.ceil(paceGapSecPerKm / SEC_PER_KM_IMPROVEMENT_PER_WEEK)

  // ─── Feasibility ──────────────────────────────────────────────────────────
  let goalFeasibility: GoalAnalysis['goalFeasibility']
  let feasibilityMessage: string

  if (gapSec <= 0) {
    goalFeasibility = 'already_there'
    feasibilityMessage = `You're already predicted to beat this goal by ${fmtTime(Math.abs(gapSec))}! Consider setting a more ambitious target.`
  } else if (weeksAvailable !== null) {
    if (weeksAvailable >= weeksNeeded * 1.2) {
      goalFeasibility = 'achievable'
      feasibilityMessage = `Achievable with ${weeksAvailable} weeks available. You need ~${weeksNeeded} weeks of consistent training to close this gap.`
    } else if (weeksAvailable >= weeksNeeded * 0.75) {
      goalFeasibility = 'ambitious'
      feasibilityMessage = `Ambitious — you have ${weeksAvailable} weeks but typically need ~${weeksNeeded} weeks for this improvement. Possible with perfect consistency.`
    } else {
      goalFeasibility = 'unrealistic'
      feasibilityMessage = `The timeline is very tight (${weeksAvailable} weeks vs ~${weeksNeeded} needed). We recommend extending your race date, or we'll set a realistic goal for this race and use this as a long-term target.`
    }
  } else {
    // No race date — just assess magnitude of improvement
    if (gapPct <= 0.05) {
      goalFeasibility = 'achievable'
      feasibilityMessage = `Only a ${(gapPct * 100).toFixed(1)}% improvement needed — very achievable with focused training.`
    } else if (gapPct <= 0.15) {
      goalFeasibility = 'achievable'
      feasibilityMessage = `A ${(gapPct * 100).toFixed(1)}% improvement needed. Achievable in ${weeksNeeded} weeks of consistent training.`
    } else if (gapPct <= 0.25) {
      goalFeasibility = 'ambitious'
      feasibilityMessage = `A ${(gapPct * 100).toFixed(1)}% improvement is ambitious. Set a race 6+ months away and build progressively.`
    } else {
      goalFeasibility = 'unrealistic'
      feasibilityMessage = `A ${(gapPct * 100).toFixed(1)}% improvement is a very long-term goal. We'll give you a realistic target for your next race.`
    }
  }

  // ─── 3-Tier Goals ─────────────────────────────────────────────────────────
  // Conservative: 50% of the gap closed
  // Realistic: 80% of the gap closed  
  // Ambitious: 100% of the gap closed (the actual goal)
  const conservativeSec = Math.round(currentPredictedSec - gapSec * 0.5)
  const realisticSec = Math.round(currentPredictedSec - gapSec * 0.80)
  const ambitiousSec = goalTimeSec

  const baseWeeklyKm = Math.max(currentWeeklyKm, 20)

  const tiers: GoalTier[] = [
    {
      label: 'Conservative',
      timeSec: conservativeSec,
      paceSecPerKm: Math.round(conservativeSec / raceKm),
      description: `Safe, achievable target. Close half the gap in your training block.`,
      color: '#4ade80',
      emoji: '🛡️',
      weeklyKmRequired: Math.round(baseWeeklyKm * 1.1),
      feasibilityNote: `Very high probability of hitting this — good for first-timers or return from injury.`,
    },
    {
      label: 'Realistic',
      timeSec: realisticSec,
      paceSecPerKm: Math.round(realisticSec / raceKm),
      description: `Strong improvement with consistent training. This is what you should aim for.`,
      color: '#facc15',
      emoji: '🎯',
      weeklyKmRequired: Math.round(baseWeeklyKm * 1.25),
      feasibilityNote: `Achievable with 3–4 runs per week and no major disruptions. This is your primary target.`,
    },
    {
      label: 'Ambitious',
      timeSec: ambitiousSec,
      paceSecPerKm: Math.round(ambitiousSec / raceKm),
      description: `Your stated goal. Full gap closed — requires excellent consistency and peak fitness.`,
      color: '#FC4C02',
      emoji: '🚀',
      weeklyKmRequired: Math.round(baseWeeklyKm * 1.4),
      feasibilityNote: `Requires near-perfect preparation. High upside — a great A-goal if everything clicks.`,
    },
  ]

  // ─── Milestones ───────────────────────────────────────────────────────────
  // Spread the improvement over training weeks
  const milestones: Milestone[] = []
  const totalWeeks = weeksAvailable ?? weeksNeeded
  const checkpoints = [0.25, 0.5, 0.75, 1.0]

  for (const frac of checkpoints) {
    const week = Math.round(totalWeeks * frac)
    if (week === 0) continue
    const targetSec = Math.round(currentPredictedSec - gapSec * frac * 0.8)
    milestones.push({
      week,
      targetTimeSec: targetSec,
      targetPaceSec: Math.round(targetSec / raceKm),
      note: frac <= 0.25
        ? 'Base building — establish easy running consistency'
        : frac <= 0.5
        ? 'Start adding tempo and interval sessions'
        : frac <= 0.75
        ? 'Peak training — longest runs, most intensity'
        : 'Taper — reduce volume, sharpen speed',
    })
  }

  // Recommended tier
  let recommendedGoalTier: GoalTier['label']
  if (goalFeasibility === 'unrealistic') recommendedGoalTier = 'Conservative'
  else if (goalFeasibility === 'ambitious') recommendedGoalTier = 'Realistic'
  else recommendedGoalTier = 'Realistic'

  return {
    raceName,
    raceKm,
    currentPredictedSec,
    goalSec: goalTimeSec,
    goalFeasibility,
    feasibilityMessage,
    gapSec,
    gapPct,
    weeksAvailable,
    weeksNeeded,
    tiers,
    milestones,
    recommendedGoalTier,
  }
}
