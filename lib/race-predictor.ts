/**
 * race-predictor.ts
 * Deterministic race time prediction engine.
 * Uses Pete Riegel formula + cross-distance sanity checks.
 * No external API — pure TypeScript math.
 */

export const RACE_KM: Record<string, number> = {
  '5K': 5,
  '10K': 10,
  'HM': 21.0975,
  'Marathon': 42.195,
}

export interface PRInput {
  pb5kSec?: number | null
  pb10kSec?: number | null
  pbHMSec?: number | null
  pbMarathonSec?: number | null
}

export interface RunSample {
  distanceKm: number
  durationSec: number
  date: string
}

export interface Prediction {
  raceName: string
  predictedSec: number
  paceSecPerKm: number
  sourceLabel: string        // what data was used
  confidence: 'high' | 'medium' | 'low'
  confidenceTip: string
}

export interface PredictionSet {
  predictions: Record<string, Prediction>
  bestSourceLabel: string
}

// ─── Riegel formula ───────────────────────────────────────────────────────────
// T2 = T1 × (D2 / D1) ^ 1.06
function riegel(sourceSec: number, sourceKm: number, targetKm: number): number {
  return sourceSec * Math.pow(targetKm / sourceKm, 1.06)
}

// ─── Endurance limitation penalty ────────────────────────────────────────────
// A runner with only 5K experience may not achieve the mathematically 
// predicted HM/Marathon time — apply a fatigue factor for large distance jumps.
function endurancePenalty(sourceKm: number, targetKm: number, yearsRunning = 1): number {
  const ratio = targetKm / sourceKm
  if (ratio <= 2) return 1.0           // small jump — no penalty
  if (ratio <= 4) return 1.0 + (ratio - 2) * 0.015  // moderate penalty
  return 1.0 + (ratio - 2) * 0.025    // big jump (5K → marathon) — larger penalty
}

// ─── Main prediction function ─────────────────────────────────────────────────
export function generatePredictions(
  prs: PRInput,
  recentRuns: RunSample[],
  yearsRunning = 1
): PredictionSet {
  // Collect all candidate data sources
  interface Source {
    sec: number
    km: number
    label: string
    isPR: boolean
  }
  const sources: Source[] = []

  if (prs.pb5kSec && prs.pb5kSec > 0)
    sources.push({ sec: prs.pb5kSec, km: 5, label: '5K PB', isPR: true })
  if (prs.pb10kSec && prs.pb10kSec > 0)
    sources.push({ sec: prs.pb10kSec, km: 10, label: '10K PB', isPR: true })
  if (prs.pbHMSec && prs.pbHMSec > 0)
    sources.push({ sec: prs.pbHMSec, km: 21.0975, label: 'Half Marathon PB', isPR: true })
  if (prs.pbMarathonSec && prs.pbMarathonSec > 0)
    sources.push({ sec: prs.pbMarathonSec, km: 42.195, label: 'Marathon PB', isPR: true })

  // Add best recent run (last 90 days, min 3km)
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000
  const validRuns = recentRuns.filter(r =>
    r.distanceKm >= 3 &&
    r.durationSec >= 600 &&
    new Date(r.date).getTime() > cutoff
  )
  if (validRuns.length > 0) {
    // Pick the run with the best implied pace
    const best = validRuns.reduce((a, b) =>
      (a.durationSec / a.distanceKm) < (b.durationSec / b.distanceKm) ? a : b
    )
    sources.push({
      sec: best.durationSec,
      km: best.distanceKm,
      label: `${best.distanceKm.toFixed(1)}km training run`,
      isPR: false,
    })
  }

  const predictions: Record<string, Prediction> = {}

  for (const [raceName, targetKm] of Object.entries(RACE_KM)) {
    // Find the source closest in distance to target (most reliable for Riegel)
    // PRs preferred over training runs; closest distance preferred
    const ranked = [...sources].sort((a, b) => {
      const aScore = (a.isPR ? 0 : 100) + Math.abs(Math.log(a.km / targetKm))
      const bScore = (b.isPR ? 0 : 100) + Math.abs(Math.log(b.km / targetKm))
      return aScore - bScore
    })

    if (ranked.length === 0) {
      continue
    }

    // Generate predictions from top sources and blend
    const topSources = ranked.slice(0, Math.min(3, ranked.length))
    const rawPredictions = topSources.map(s => {
      const penalty = endurancePenalty(s.km, targetKm, yearsRunning)
      return riegel(s.sec, s.km, targetKm) * penalty
    })

    // Weighted average: best source gets 60%, second 30%, third 10%
    const weights = [0.6, 0.3, 0.1]
    const blended = rawPredictions.reduce(
      (sum, p, i) => sum + p * (weights[i] || 0), 0
    ) / rawPredictions.reduce((sum, _, i) => sum + (weights[i] || 0), 0)

    // Confidence
    const bestSrc = ranked[0]
    const distRatio = Math.max(bestSrc.km, targetKm) / Math.min(bestSrc.km, targetKm)
    let confidence: 'high' | 'medium' | 'low'
    let confidenceTip: string

    if (bestSrc.isPR && distRatio <= 2) {
      confidence = 'high'
      confidenceTip = 'Based on a personal best at a similar distance — very reliable.'
    } else if (bestSrc.isPR || distRatio <= 3) {
      confidence = 'medium'
      confidenceTip = 'Good estimate. A race at a closer distance would improve accuracy.'
    } else {
      confidence = 'low'
      confidenceTip = 'Large distance gap — this is an estimate. Run the shorter distance in a time trial for a better prediction.'
    }

    predictions[raceName] = {
      raceName,
      predictedSec: Math.round(blended),
      paceSecPerKm: Math.round(blended / targetKm),
      sourceLabel: bestSrc.label,
      confidence,
      confidenceTip,
    }
  }

  const bestSource = sources.length > 0
    ? sources.find(s => s.isPR) || sources[0]
    : null

  return {
    predictions,
    bestSourceLabel: bestSource?.label ?? 'No data',
  }
}

// ─── Utility exports ──────────────────────────────────────────────────────────

export function fmtTime(sec: number): string {
  if (!isFinite(sec) || sec <= 0) return '—'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.round(sec % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function fmtPace(secPerKm: number): string {
  if (!isFinite(secPerKm) || secPerKm <= 0) return '—'
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')}/km`
}

export function parseTimeInput(val: string): number | null {
  const clean = val.trim().replace(/[.]/g, ':')
  const parts = clean.split(':').map(s => parseInt(s, 10))
  if (parts.some(isNaN) || parts.length === 0) return null
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 1 && parts[0] > 0) return parts[0] * 60
  return null
}
