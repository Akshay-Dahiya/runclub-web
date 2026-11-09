"use client"

/**
 * RacePredictor.tsx — Goal Wizard + Next Run Coach
 *
 * Step 1: Enter your personal bests (5K / 10K / HM) — or we use logged runs
 * Step 2: Pick your goal race + set a target time
 * Step 3: See your predicted time, gap to goal, and an exact next-run prescription
 *
 * Uses Pete Riegel formula: T2 = T1 × (D2/D1)^1.06
 */

import React, { useState, useMemo } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Run {
  id: string
  distanceKm: number
  durationSec: number
  paceSecPerKm: number
  date: string
}

interface Props {
  runs: Run[]
  targetRace?: '5K' | '10K' | 'HM' | 'Marathon'
  userName?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RACE_DISTANCES: Record<string, number> = {
  '5K': 5, '10K': 10, 'HM': 21.0975, 'Marathon': 42.195,
}

const RACE_LABELS: Record<string, string> = {
  '5K': '5K · 5km', '10K': '10K · 10km', 'HM': 'Half Marathon · 21.1km', 'Marathon': 'Full Marathon · 42.2km',
}

// ─── Utility helpers ─────────────────────────────────────────────────────────

function fmtTime(sec: number) {
  if (!isFinite(sec) || sec <= 0) return '—'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.round(sec % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function fmtPace(secPerKm: number) {
  if (!isFinite(secPerKm) || secPerKm <= 0) return '—'
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')}/km`
}

function parseTimeInput(val: string): number | null {
  // Accepts: H:MM:SS, MM:SS, or plain minutes
  const clean = val.trim().replace(/[.]/g, ':')
  const parts = clean.split(':').map(s => parseInt(s, 10))
  if (parts.some(isNaN)) return null
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 1 && parts[0] > 0) return parts[0] * 60
  return null
}

function riegel(sourceSec: number, sourceKm: number, targetKm: number): number {
  return sourceSec * Math.pow(targetKm / sourceKm, 1.06)
}

function secGap(actualSec: number, goalSec: number) {
  const diff = actualSec - goalSec
  const abs = Math.abs(diff)
  const m = Math.floor(abs / 60)
  const s = Math.round(abs % 60)
  const label = `${m}m ${s}s`
  return { diff, label, ahead: diff < 0 }
}

// ─── Next-run prescription engine ────────────────────────────────────────────

interface NextRun {
  type: string
  emoji: string
  distance: string
  pace: string
  duration: string
  purpose: string
  instructions: string[]
  color: string
}

function prescribeNextRun(
  goalRace: string,
  currentPredictedSec: number,
  goalSec: number,
  runs: Run[],
  goalKm: number
): NextRun {
  const goalPaceSec = goalSec / goalKm
  const currentPaceSec = currentPredictedSec / goalKm
  const gapPct = (currentPaceSec - goalPaceSec) / goalPaceSec  // how far off (positive = slower)

  const recentRuns = [...runs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const lastRunDays = recentRuns.length > 0
    ? Math.floor((Date.now() - new Date(recentRuns[0].date).getTime()) / 86400000)
    : 99

  // If they haven't run in a while → easy re-entry run
  if (lastRunDays > 5) {
    return {
      type: 'Easy Re-Entry Run',
      emoji: '🌱',
      distance: goalRace === 'Marathon' ? '8–10 km' : goalRace === 'HM' ? '6–8 km' : '4–5 km',
      pace: fmtPace(currentPaceSec * 1.15),
      duration: goalRace === 'Marathon' ? '50–65 min' : goalRace === 'HM' ? '40–55 min' : '30–40 min',
      purpose: 'Get your legs moving again after a break.',
      instructions: [
        'Run fully conversational — you should be able to sing',
        'No pace pressure. This is about consistency, not speed',
        'Focus on breathing rhythm: 3 steps inhale, 2 steps exhale',
        'End feeling like you could do another 20 minutes',
      ],
      color: '#4ade80',
    }
  }

  // If way off goal (>15%) → long easy run to build aerobic base
  if (gapPct > 0.15) {
    const longDistKm = goalRace === 'Marathon' ? 18 : goalRace === 'HM' ? 12 : goalRace === '10K' ? 8 : 5
    return {
      type: 'Long Aerobic Run',
      emoji: '🏔️',
      distance: `${longDistKm}–${longDistKm + 2} km`,
      pace: fmtPace(currentPaceSec * 1.1),
      duration: `${Math.round((longDistKm * currentPaceSec * 1.1) / 60)}–${Math.round(((longDistKm + 2) * currentPaceSec * 1.1) / 60)} min`,
      purpose: 'Build the aerobic base — this is what closes the big gap to your goal.',
      instructions: [
        'Start 20–30 sec/km slower than your comfortable pace',
        'If you can\'t hold a conversation, slow down',
        'Stay in heart rate zone 2 the whole run (easy effort)',
        'The last 2 km, pick up slightly to feel the finish',
        'Fuel with water every 20 min on runs over 60 min',
      ],
      color: '#22d3ee',
    }
  }

  // If moderately off (5–15%) → tempo run to sharpen lactate threshold
  if (gapPct > 0.05) {
    const tempoKm = goalRace === 'Marathon' ? 8 : goalRace === 'HM' ? 6 : 4
    return {
      type: 'Tempo Run',
      emoji: '⚡',
      distance: `${tempoKm} km at pace + 2 km warm-up/cool-down`,
      pace: fmtPace(goalPaceSec * 1.03),
      duration: `${Math.round((tempoKm * goalPaceSec * 1.03 + 4 * currentPaceSec * 1.1) / 60)}–${Math.round((tempoKm * goalPaceSec * 1.03 + 4 * currentPaceSec * 1.1) / 60) + 5} min`,
      purpose: 'Train your lactate threshold — the fastest sustainable pace. This directly closes the gap to your goal.',
      instructions: [
        `Warm up 2 km at easy pace (${fmtPace(currentPaceSec * 1.1)})`,
        `Run ${tempoKm} km at ${fmtPace(goalPaceSec * 1.03)} — "comfortably hard", only short phrases`,
        `Cool down 2 km at easy pace`,
        'This should feel controlled, not all-out',
        'If you can chat easily, pick it up slightly',
      ],
      color: '#facc15',
    }
  }

  // Close to goal (< 5%) → interval session for speed
  const intervalReps = goalRace === '5K' ? 8 : goalRace === '10K' ? 6 : 5
  const intervalDist = goalRace === '5K' ? '400m' : goalRace === '10K' ? '600m' : '800m'
  return {
    type: 'Speed Intervals',
    emoji: '🔥',
    distance: `${intervalReps} × ${intervalDist} with equal rest`,
    pace: fmtPace(goalPaceSec * 0.95),
    duration: '45–55 min total with warm-up/cool-down',
    purpose: `You're close to your goal! These intervals sharpen the top-end speed you need to hit your ${goalRace} target.`,
    instructions: [
      `Warm up 1.5 km at easy pace`,
      `Run ${intervalReps} × ${intervalDist} at ${fmtPace(goalPaceSec * 0.95)} — this should feel hard`,
      `Rest between each: walk/jog the same distance you just ran`,
      `Cool down 1.5 km easy`,
      'If reps 6–8 feel too easy, your goal time might be conservative — push it!',
    ],
    color: '#FC4C02',
  }
}

// ─── Input component ──────────────────────────────────────────────────────────

function TimeInput({
  label, sublabel, value, onChange, placeholder
}: { label: string; sublabel: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const parsed = parseTimeInput(value)
  const isValid = !value || parsed !== null
  return (
    <div>
      <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'var(--bg)',
            border: `1px solid ${!isValid ? '#ef4444' : value && parsed ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: '8px', padding: '12px 14px',
            fontFamily: 'monospace', fontSize: '15px', fontWeight: 700,
            color: 'var(--text)', outline: 'none',
            transition: 'border-color 0.2s',
          }}
        />
        {value && parsed && (
          <div style={{
            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
            fontSize: '12px', color: '#4ade80',
          }}>✓</div>
        )}
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--muted)', marginTop: '4px' }}>
        {sublabel}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type Step = 'prs' | 'goal' | 'results'

export default function RacePredictor({ runs, targetRace, userName }: Props) {
  // Step state
  const [step, setStep] = useState<Step>('prs')

  // Step 1 — Personal bests
  const [pr5k, setPr5k] = useState('')
  const [pr10k, setPr10k] = useState('')
  const [prHM, setPrHM] = useState('')

  // Step 2 — Goal
  const [goalRace, setGoalRace] = useState<string>(targetRace || '10K')
  const [goalTime, setGoalTime] = useState('')
  const [goalSubmitted, setGoalSubmitted] = useState(false)

  const goalKm = RACE_DISTANCES[goalRace]

  // ─── Best source for prediction ────────────────────────────────────────────
  const bestSource = useMemo(() => {
    // Collect all PR inputs + logged run data as candidate sources
    const candidates: Array<{ sec: number; km: number; label: string }> = []

    if (parseTimeInput(pr5k)) candidates.push({ sec: parseTimeInput(pr5k)!, km: 5, label: '5K PR' })
    if (parseTimeInput(pr10k)) candidates.push({ sec: parseTimeInput(pr10k)!, km: 10, label: '10K PR' })
    if (parseTimeInput(prHM)) candidates.push({ sec: parseTimeInput(prHM)!, km: 21.0975, label: 'HM PR' })

    // Add best logged run
    const validRuns = (runs || []).filter(r =>
      r.distanceKm >= 1 && r.durationSec >= 60 &&
      r.paceSecPerKm > 100 && r.paceSecPerKm < 1200
    )
    if (validRuns.length > 0) {
      const best = validRuns.reduce((a, b) => {
        const aEq = riegel(a.durationSec, a.distanceKm, goalKm)
        const bEq = riegel(b.durationSec, b.distanceKm, goalKm)
        return aEq < bEq ? a : b
      })
      candidates.push({ sec: best.durationSec, km: best.distanceKm, label: `${best.distanceKm.toFixed(1)}km run on ${new Date(best.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` })
    }

    if (candidates.length === 0) return null

    // Pick the one that gives the best (fastest) Riegel prediction for goal race
    const best = candidates.reduce((a, b) => {
      const aP = riegel(a.sec, a.km, goalKm)
      const bP = riegel(b.sec, b.km, goalKm)
      return aP <= bP ? a : b
    })

    return { ...best, predicted: riegel(best.sec, best.km, goalKm) }
  }, [pr5k, pr10k, prHM, runs, goalKm])

  const goalSec = parseTimeInput(goalTime)
  const predictedSec = bestSource?.predicted ?? null

  // Gap analysis
  const gap = predictedSec && goalSec ? secGap(predictedSec, goalSec) : null

  // Next run prescription
  const nextRun = useMemo(() => {
    if (!predictedSec || !goalSec) return null
    return prescribeNextRun(goalRace, predictedSec, goalSec, runs || [], goalKm)
  }, [predictedSec, goalSec, goalRace, runs, goalKm])

  // ─── Helper: can they proceed? ─────────────────────────────────────────────
  const hasPRs = !!(parseTimeInput(pr5k) || parseTimeInput(pr10k) || parseTimeInput(prHM))
  const hasLoggedRuns = (runs || []).length > 0
  const canProceedFromPRs = hasPRs || hasLoggedRuns

  const inputStyle = {
    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px',
    padding: '12px 14px', fontFamily: 'monospace', fontSize: '15px', fontWeight: 700,
    color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box' as const,
  }

  const btnPrimary = {
    background: 'var(--accent)', color: '#000', border: 'none',
    borderRadius: '8px', padding: '14px 28px', fontFamily: 'monospace',
    fontSize: '13px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.5px',
    transition: 'opacity 0.2s',
  }

  const btnSecondary = {
    background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '12px 20px', fontFamily: 'monospace',
    fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s',
  }

  // ─── Step indicator ────────────────────────────────────────────────────────
  const steps = [
    { key: 'prs', label: 'Your Times', num: 1 },
    { key: 'goal', label: 'Set a Goal', num: 2 },
    { key: 'results', label: 'Your Plan', num: 3 },
  ]

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--surface) 0%, rgba(252,76,2,0.04) 100%)',
      border: '1px solid var(--border)', borderRadius: '16px',
      padding: '32px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '-60px', right: '-60px',
        width: '220px', height: '220px',
        background: 'radial-gradient(circle, rgba(252,76,2,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '1.4rem' }}>🏁</span>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', margin: 0, letterSpacing: '1px' }}>
            Race Predictor & Goal Coach
          </h3>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '11px', fontFamily: 'monospace', margin: 0 }}>
          Enter your personal bests → set a goal → get your next training run prescribed
        </p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '32px' }}>
        {steps.map((s, i) => {
          const isActive = s.key === step
          const isDone = steps.findIndex(x => x.key === step) > i
          return (
            <React.Fragment key={s.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: isDone ? '#4ade80' : isActive ? 'var(--accent)' : 'var(--surface)',
                  border: `2px solid ${isDone ? '#4ade80' : isActive ? 'var(--accent)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'monospace', fontSize: '11px', fontWeight: 700,
                  color: isDone ? '#000' : isActive ? '#000' : 'var(--muted)',
                  flexShrink: 0,
                }}>
                  {isDone ? '✓' : s.num}
                </div>
                <span style={{
                  fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.5px',
                  color: isActive ? 'var(--text)' : 'var(--muted)', fontWeight: isActive ? 700 : 400,
                  whiteSpace: 'nowrap',
                }}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: '1px', background: isDone ? '#4ade8044' : 'var(--border)', margin: '0 10px' }} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* ═══════════════ STEP 1: Personal Bests ═══════════════ */}
      {step === 'prs' && (
        <div style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem', marginBottom: '6px', letterSpacing: '0.5px' }}>
              What are your current best times?
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)' }}>
              Enter what you know. Leave blank if you haven't run that distance.
              {hasLoggedRuns && !hasPRs && (
                <span style={{ color: '#4ade80', marginLeft: '8px' }}>
                  ✓ We'll use your {runs.length} logged run{runs.length !== 1 ? 's' : ''} if you skip this
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <TimeInput
              label="5K PERSONAL BEST"
              sublabel="Format: MM:SS (e.g. 25:30)"
              value={pr5k}
              onChange={setPr5k}
              placeholder="e.g. 25:30"
            />
            <TimeInput
              label="10K PERSONAL BEST"
              sublabel="Format: MM:SS (e.g. 55:00)"
              value={pr10k}
              onChange={setPr10k}
              placeholder="e.g. 55:00"
            />
            <TimeInput
              label="HALF MARATHON BEST"
              sublabel="Format: H:MM:SS (e.g. 2:05:00)"
              value={prHM}
              onChange={setPrHM}
              placeholder="e.g. 2:05:00"
            />
          </div>

          {/* Live cross-predictions */}
          {hasPRs && (
            <div style={{
              background: 'var(--bg)', borderRadius: '10px', padding: '16px',
              border: '1px solid rgba(252,76,2,0.2)', marginBottom: '24px',
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '2px', color: 'var(--accent)', marginBottom: '12px' }}>
                WHAT THESE TIMES PREDICT FOR YOU
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
                {Object.keys(RACE_DISTANCES).map(race => {
                  const km = RACE_DISTANCES[race]
                  // Find the best PR to predict from
                  const sources = [
                    pr5k && parseTimeInput(pr5k) ? { sec: parseTimeInput(pr5k)!, km: 5 } : null,
                    pr10k && parseTimeInput(pr10k) ? { sec: parseTimeInput(pr10k)!, km: 10 } : null,
                    prHM && parseTimeInput(prHM) ? { sec: parseTimeInput(prHM)!, km: 21.0975 } : null,
                  ].filter(Boolean) as Array<{ sec: number; km: number }>

                  if (sources.length === 0) return null
                  const best = sources.reduce((a, b) => riegel(a.sec, a.km, km) < riegel(b.sec, b.km, km) ? a : b)
                  const predicted = riegel(best.sec, best.km, km)

                  return (
                    <div key={race} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '8px', color: 'var(--muted)', letterSpacing: '1px', marginBottom: '4px' }}>{race}</div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem', color: 'var(--accent)' }}>{fmtTime(predicted)}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '8px', color: 'var(--muted)' }}>{fmtPace(predicted / km)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              style={{ ...btnPrimary, opacity: canProceedFromPRs ? 1 : 0.4 }}
              disabled={!canProceedFromPRs}
              onClick={() => setStep('goal')}
            >
              Set My Goal →
            </button>
            {!canProceedFromPRs && (
              <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--muted)' }}>
                Enter at least one time, or log a run first
              </span>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ STEP 2: Set Goal ═══════════════ */}
      {step === 'goal' && (
        <div style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem', marginBottom: '6px', letterSpacing: '0.5px' }}>
              What race are you training for?
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)' }}>
              Pick the distance and set a time you want to achieve.
            </div>
          </div>

          {/* Race picker */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '28px' }}>
            {Object.keys(RACE_DISTANCES).map(race => {
              const km = RACE_DISTANCES[race]
              // Show predicted for this race
              const predicted = bestSource ? riegel(bestSource.sec, bestSource.km, km) : null
              const isSelected = goalRace === race
              return (
                <button
                  key={race}
                  onClick={() => setGoalRace(race)}
                  style={{
                    padding: '16px 12px', borderRadius: '10px', textAlign: 'left',
                    border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    background: isSelected ? 'rgba(252,76,2,0.08)' : 'var(--surface)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', color: isSelected ? 'var(--accent)' : 'var(--text)', letterSpacing: '0.5px' }}>
                    {race}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '8px', color: 'var(--muted)', marginBottom: '8px' }}>
                    {km === 21.0975 ? '21.1km' : km === 42.195 ? '42.2km' : `${km}km`}
                  </div>
                  {predicted && (
                    <div>
                      <div style={{ fontFamily: 'monospace', fontSize: '10px', color: isSelected ? 'var(--accent)' : 'var(--muted)', fontWeight: 700 }}>
                        {fmtTime(predicted)}
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '8px', color: 'var(--muted)' }}>current prediction</div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Goal time */}
          <div style={{ marginBottom: '28px', maxWidth: '320px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: '8px' }}>
              YOUR GOAL TIME FOR {goalRace}
            </div>
            <input
              type="text"
              style={inputStyle}
              placeholder={goalRace === 'HM' || goalRace === 'Marathon' ? 'e.g. 2:00:00' : 'e.g. 50:00'}
              value={goalTime}
              onChange={e => setGoalTime(e.target.value)}
            />
            {goalSec && predictedSec && gap && (
              <div style={{
                marginTop: '10px', padding: '10px 14px', borderRadius: '8px',
                background: gap.ahead ? 'rgba(74,222,128,0.1)' : 'rgba(252,76,2,0.08)',
                border: `1px solid ${gap.ahead ? 'rgba(74,222,128,0.3)' : 'rgba(252,76,2,0.2)'}`,
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: gap.ahead ? '#4ade80' : '#FC4C02', fontWeight: 700 }}>
                  {gap.ahead
                    ? `🚀 You're already ${gap.label} faster than your goal!`
                    : `🎯 ${gap.label} to close to reach this goal`
                  }
                </span>
              </div>
            )}
            {goalTime && !goalSec && (
              <div style={{ marginTop: '6px', fontFamily: 'monospace', fontSize: '10px', color: '#ef4444' }}>
                Enter time as MM:SS or H:MM:SS
              </div>
            )}
            <div style={{ marginTop: '6px', fontFamily: 'monospace', fontSize: '9px', color: 'var(--muted)' }}>
              Set an ambitious but realistic goal. Your current prediction for {goalRace}: {predictedSec ? fmtTime(predictedSec) : '—'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button style={btnSecondary} onClick={() => setStep('prs')}>← Back</button>
            <button
              style={{ ...btnPrimary, opacity: goalSec ? 1 : 0.4 }}
              disabled={!goalSec}
              onClick={() => { setGoalSubmitted(true); setStep('results') }}
            >
              Get My Training Plan →
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════ STEP 3: Results + Next Run ═══════════════ */}
      {step === 'results' && predictedSec && goalSec && nextRun && (
        <div style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
          {/* Summary header */}
          <div style={{
            background: 'var(--bg)', borderRadius: '12px', padding: '24px',
            border: '1px solid var(--border)', marginBottom: '20px',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '2px', color: 'var(--muted)', marginBottom: '8px' }}>
                CURRENT {goalRace} PREDICTION
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', color: 'var(--accent)', lineHeight: 1 }}>
                {fmtTime(predictedSec)}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--muted)', marginTop: '4px' }}>
                @ {fmtPace(predictedSec / goalKm)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '2px', color: 'var(--muted)', marginBottom: '8px' }}>
                YOUR GOAL TIME
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', color: '#4ade80', lineHeight: 1 }}>
                {fmtTime(goalSec)}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--muted)', marginTop: '4px' }}>
                @ {fmtPace(goalSec / goalKm)}
              </div>
            </div>
          </div>

          {/* Gap bar */}
          {gap && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '10px', color: 'var(--muted)', marginBottom: '6px' }}>
                <span>Goal: {fmtTime(goalSec)}</span>
                <span style={{ color: gap.ahead ? '#4ade80' : '#FC4C02', fontWeight: 700 }}>
                  {gap.ahead ? `🚀 Already ${gap.label} faster than goal!` : `Gap to close: ${gap.label}`}
                </span>
                <span>Current: {fmtTime(predictedSec)}</span>
              </div>
              <div style={{ height: '8px', background: 'var(--surface)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                {!gap.ahead && (
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, (goalSec / predictedSec) * 100)}%`,
                    background: 'linear-gradient(90deg, var(--accent), #facc15)',
                    borderRadius: '4px',
                    transition: 'width 1s ease',
                  }} />
                )}
                {gap.ahead && (
                  <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg, #4ade80, #22d3ee)', borderRadius: '4px' }} />
                )}
              </div>
            </div>
          )}

          {/* Next Run Box — the centrepiece */}
          <div style={{
            background: `linear-gradient(135deg, ${nextRun.color}10 0%, var(--surface) 100%)`,
            border: `2px solid ${nextRun.color}50`,
            borderRadius: '14px', padding: '24px', marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '18px', flexWrap: 'wrap' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: `${nextRun.color}20`, border: `1px solid ${nextRun.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0,
              }}>
                {nextRun.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '2px', color: nextRun.color, marginBottom: '4px' }}>
                  YOUR NEXT RUN
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', letterSpacing: '0.5px' }}>
                  {nextRun.type}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
              {[
                { label: 'DISTANCE', value: nextRun.distance },
                { label: 'TARGET PACE', value: nextRun.pace },
                { label: 'EST. DURATION', value: nextRun.duration },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'var(--bg)', borderRadius: '8px', padding: '12px',
                  border: '1px solid var(--border)', textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>{s.value}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '8px', color: 'var(--muted)', letterSpacing: '1px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Purpose */}
            <div style={{
              background: `${nextRun.color}0D`, borderLeft: `3px solid ${nextRun.color}`,
              borderRadius: '0 8px 8px 0', padding: '12px 14px', marginBottom: '16px',
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text)', lineHeight: 1.6 }}>
                {nextRun.purpose}
              </div>
            </div>

            {/* Step by step instructions */}
            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: '10px' }}>
              HOW TO DO THIS RUN
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {nextRun.instructions.map((inst, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                    background: `${nextRun.color}20`, border: `1px solid ${nextRun.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, color: nextRun.color,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text)', lineHeight: 1.6, paddingTop: '2px' }}>
                    {inst}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Source note */}
          {bestSource && (
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--muted)', marginBottom: '16px', textAlign: 'center' }}>
              Prediction based on: <strong style={{ color: 'var(--text)' }}>{bestSource.label}</strong> · Riegel formula T2 = T1 × (D2/D1)^1.06
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button style={btnSecondary} onClick={() => setStep('goal')}>← Change Goal</button>
            <button style={btnSecondary} onClick={() => { setStep('prs'); setPr5k(''); setPr10k(''); setPrHM(''); setGoalTime('') }}>
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
