/**
 * micro-goals.ts
 * Generates small, achievable weekly micro-goals based on the runner's last 30 days.
 * Always reinforces the core philosophy: "To run FAST, you must run SLOW."
 */

export interface MicroGoal {
  id: string
  title: string
  description: string
  category: 'volume' | 'slow_run' | 'consistency' | 'speed_milestone' | 'fun'
  icon: string
  targetValue?: number
  currentValue?: number
  completed?: boolean
}

export interface RunData {
  distanceKm: number
  durationSec: number
  paceSecPerKm: number
  date: string | Date
}

export function generateMicroGoals(runs: RunData[], userGoalCategory?: string): MicroGoal[] {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000)

  // Filter runs in the last 30 days
  const recentRuns = (runs || []).filter(r => new Date(r.date) >= thirtyDaysAgo)

  // Calculate 30-day stats
  const totalKm30 = recentRuns.reduce((sum, r) => sum + (r.distanceKm || 0), 0)
  const avgWeeklyKm = Math.round((totalKm30 / 4.28) * 10) / 10 // ~4.3 weeks in 30 days
  const runCount30 = recentRuns.length
  const avgRunsPerWeek = Math.round((runCount30 / 4.28) * 10) / 10

  // Find longest run
  const longestRunKm = recentRuns.length > 0 
    ? Math.max(...recentRuns.map(r => r.distanceKm || 0)) 
    : 0

  // Average easy pace (rough baseline)
  const avgPaceSec = recentRuns.length > 0
    ? Math.round(recentRuns.reduce((sum, r) => sum + (r.paceSecPerKm || 0), 0) / recentRuns.length)
    : 360 // default 6:00/km

  const goals: MicroGoal[] = []

  // ── 1. The Core "Run Slow" Goal (Mandatory in all sets) ──
  goals.push({
    id: 'goal-run-slow-1',
    title: 'The "Pure Joy" Slow Miles',
    description: 'Complete 1 easy run where you run fully conversational and don\'t stress about pace. 80% of your progress comes from this.',
    category: 'slow_run',
    icon: '🐢',
  })

  // ── 2. Volume or Habit Goal (Gradual, safe +10% rule) ──
  if (avgWeeklyKm < 12 || runCount30 < 4) {
    // Beginner / restarting runner
    goals.push({
      id: 'goal-volume-beginner',
      title: 'Habit Builder: 3 Runs This Week',
      description: 'Lace up 3 times this week for at least 15–20 minutes. Distance does not matter — showing up is the victory.',
      category: 'consistency',
      icon: '🌱',
      targetValue: 3,
    })
    goals.push({
      id: 'goal-distance-starter',
      title: 'Target: 10–12 Total Kilometers',
      description: 'Accumulate 10 to 12 km across the entire week with gentle walking breaks whenever you feel tired.',
      category: 'volume',
      icon: '📈',
      targetValue: 12,
    })
  } else if (avgWeeklyKm < 25) {
    // Regular runner (12 - 25 km/wk)
    const targetWeekly = Math.round(avgWeeklyKm * 1.1) // safe 10% bump
    goals.push({
      id: 'goal-volume-stepping-up',
      title: `Hit ${targetWeekly} km This Week (+10% Boost)`,
      description: `Step up from your recent ${avgWeeklyKm} km average by adding just one extra kilometer to two of your runs.`,
      category: 'volume',
      icon: '📈',
      targetValue: targetWeekly,
    })
    goals.push({
      id: 'goal-longest-distance',
      title: `Weekend Long Run: ${Math.round(longestRunKm + 1.5)} km`,
      description: `Your longest run was ${longestRunKm.toFixed(1)} km. Add 1.5 km to your weekend cruise at a super comfortable pace.`,
      category: 'distance_builder' as any,
      icon: '🏔️',
    })
  } else {
    // Experienced runner (25+ km/wk)
    goals.push({
      id: 'goal-power-strides',
      title: 'Add 4 × 100m Strides',
      description: 'At the end of an easy run, run 4 relaxed accelerations to maintain turnover without taxing your heart.',
      category: 'speed_milestone',
      icon: '⚡',
    })
    goals.push({
      id: 'goal-steady-streak',
      title: 'Hold Steady Volume for 3 Weeks',
      description: `Maintain consistency between ${Math.round(avgWeeklyKm * 0.9)}–${Math.round(avgWeeklyKm * 1.1)} km without skipping your rest days.`,
      category: 'consistency',
      icon: '🔥',
    })
  }

  // Adjust for selected user goal category if present
  if (userGoalCategory === 'fun') {
    goals[1] = {
      id: 'goal-scenic-fun',
      title: 'Explore a New Route',
      description: 'Turn down a street, park, or trail you have never explored before. No watch checking allowed.',
      category: 'fun',
      icon: '🌳',
    }
  }

  return goals.slice(0, 3)
}
