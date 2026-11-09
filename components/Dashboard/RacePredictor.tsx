"use client"

/**
 * RacePredictor.tsx
 * Uses the Pete Riegel formula: T2 = T1 × (D2/D1)^1.06
 * Enhanced with training data from the runner's logged runs.
 */

import React, { useState, useMemo } from 'react'

interface Run {
  id: string
  distanceKm: number
  durationSec: number
  paceSecPerKm: number
  date: string
}

interface Props {
  runs: Run[]
  targetRace: '5K' | '10K' | 'HM' | 'Marathon'
}

const RACE_DISTANCES: Record<string, number> = {
  '5K': 5,
  '10K': 10,
  'HM': 21.0975,
  'Marathon': 42.195,
}

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

function riegelPredict(sourceSec: number, sourceKm: number, targetKm: number): number {
  // Pete Riegel: T2 = T1 × (D2/D1)^1.06
  return sourceSec * Math.pow(targetKm / sourceKm, 1.06)
}

function getConfidenceLabel(runCount: number, longestKm: number, targetKm: number): { label: string; color: string; tip: string } {
  if (runCount === 0) return { label: 'No data', color: '#666', tip: 'Log some runs to get a prediction.' }
  const coverageRatio = longestKm / targetKm
  if (runCount >= 10 && coverageRatio >= 0.7) return { label: 'High confidence', color: '#4ade80', tip: 'You have solid training data for this distance.' }
  if (runCount >= 5 && coverageRatio >= 0.4) return { label: 'Medium confidence', color: '#facc15', tip: 'More long runs will improve accuracy.' }
  return { label: 'Low confidence', color: '#f97316', tip: 'Log more runs at longer distances for a better estimate.' }
}

export default function RacePredictor({ runs, targetRace }: Props) {
  const [selectedRace, setSelectedRace] = useState<string>(targetRace || '10K')
  const [manualPace, setManualPace] = useState('')  // MM:SS format override

  const targetKm = RACE_DISTANCES[selectedRace]

  const analysis = useMemo(() => {
    if (!runs || runs.length === 0) return null

    // Sort by date descending, use last 90 days for recency
    const now = Date.now()
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000
    const recentRuns = runs.filter(r => new Date(r.date).getTime() > ninetyDaysAgo)
    const workingRuns = recentRuns.length >= 3 ? recentRuns : runs

    // Filter runs with reasonable data only
    const validRuns = workingRuns.filter(r =>
      r.distanceKm >= 1 &&
      r.durationSec >= 60 &&
      r.paceSecPerKm > 100 && r.paceSecPerKm < 1200 // 100s–20min pace
    )

    if (validRuns.length === 0) return null

    // Find the best reference run: longest distance closest to target
    const sortedByDist = [...validRuns].sort((a, b) => b.distanceKm - a.distanceKm)
    const longestRun = sortedByDist[0]

    // Best pace run (fastest per km, min 5km distance)
    const longEnoughForPace = validRuns.filter(r => r.distanceKm >= 5)
    const bestPaceRun = longEnoughForPace.length > 0
      ? longEnoughForPace.reduce((a, b) => a.paceSecPerKm < b.paceSecPerKm ? a : b)
      : null

    // Average recent pace from runs >= 5km
    const paceRuns = validRuns.filter(r => r.distanceKm >= 5)
    const avgPaceSec = paceRuns.length > 0
      ? paceRuns.reduce((s, r) => s + r.paceSecPerKm, 0) / paceRuns.length
      : validRuns.reduce((s, r) => s + r.paceSecPerKm, 0) / validRuns.length

    // Riegel prediction from longest run
    const riegelSec = riegelPredict(longestRun.durationSec, longestRun.distanceKm, targetKm)

    // Pace-based prediction (conservative: avg pace × target km, slightly adjusted for fatigue)
    const fatigueFactor = selectedRace === 'Marathon' ? 1.12 : selectedRace === 'HM' ? 1.06 : selectedRace === '10K' ? 1.03 : 1.0
    const pacePredSec = avgPaceSec * fatigueFactor * targetKm

    // Weighted average: Riegel 60%, pace-based 40% (Riegel is more proven)
    const blendedSec = (riegelSec * 0.6) + (pacePredSec * 0.4)

    // Realistic + optimistic
    const optimisticSec = blendedSec * 0.97  // 3% improvement if well-trained
    const conservativeSec = blendedSec * 1.04 // 4% buffer for race-day variation

    const confidence = getConfidenceLabel(validRuns.length, longestRun.distanceKm, targetKm)

    return {
      predicted: blendedSec,
      optimistic: optimisticSec,
      conservative: conservativeSec,
      predictedPace: blendedSec / targetKm,
      longestRun,
      bestPaceRun,
      runCount: validRuns.length,
      confidence,
      riegelSec,
      pacePredSec,
    }
  }, [runs, selectedRace, targetKm])

  // Manual override
  const manualPrediction = useMemo(() => {
    if (!manualPace.trim()) return null
    const parts = manualPace.split(':').map(Number)
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null
    const secPerKm = parts[0] * 60 + parts[1]
    if (secPerKm < 120 || secPerKm > 900) return null
    return secPerKm * targetKm
  }, [manualPace, targetKm])

  const finalPredicted = manualPrediction || analysis?.predicted

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--surface) 0%, rgba(252,76,2,0.05) 100%)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '32px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background accent */}
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px',
        width: '160px', height: '160px',
        background: 'radial-gradient(circle, rgba(252,76,2,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.4rem' }}>🏁</span>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', margin: 0, letterSpacing: '1px' }}>
            Race Time Predictor
          </h3>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'monospace', margin: 0 }}>
          Based on your logged runs using the Pete Riegel formula — the same method used by Garmin, Strava, and elite coaches.
        </p>
      </div>

      {/* Race selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {Object.keys(RACE_DISTANCES).map(race => (
          <button
            key={race}
            onClick={() => setSelectedRace(race)}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: `1px solid ${selectedRace === race ? 'var(--accent)' : 'var(--border)'}`,
              background: selectedRace === race ? 'var(--accent)' : 'transparent',
              color: selectedRace === race ? '#000' : 'var(--text)',
              fontFamily: 'monospace', fontSize: '12px', fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s',
              letterSpacing: '0.5px',
            }}
          >
            {race}
            <span style={{ fontSize: '9px', opacity: 0.7, marginLeft: '4px' }}>
              {race === 'HM' ? '21.1km' : race === 'Marathon' ? '42.2km' : `${RACE_DISTANCES[race]}km`}
            </span>
          </button>
        ))}
      </div>

      {!analysis && (
        <div style={{
          textAlign: 'center', padding: '48px 20px',
          color: 'var(--muted)', fontFamily: 'monospace',
          border: '1px dashed var(--border)', borderRadius: '12px',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🏃</div>
          <div>Log at least 1 run to get your race prediction!</div>
          <div style={{ fontSize: '11px', marginTop: '8px', opacity: 0.7 }}>More runs = more accurate prediction</div>
        </div>
      )}

      {analysis && (
        <>
          {/* Main prediction card */}
          <div style={{
            background: 'var(--bg)', borderRadius: '12px', padding: '28px',
            border: '1px solid var(--border)', marginBottom: '20px',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '2px', color: 'var(--muted)', marginBottom: '12px' }}>
              PREDICTED {selectedRace} FINISH TIME
            </div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'clamp(2.5rem, 8vw, 4rem)',
              color: 'var(--accent)',
              lineHeight: 1,
              marginBottom: '12px',
              letterSpacing: '2px',
            }}>
              {fmtTime(finalPredicted!)}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)' }}>
              @ {fmtPace(finalPredicted! / targetKm)} average pace
            </div>

            {/* Confidence badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              marginTop: '16px', padding: '6px 14px',
              background: `${analysis.confidence.color}15`,
              border: `1px solid ${analysis.confidence.color}40`,
              borderRadius: '20px',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: analysis.confidence.color }} />
              <span style={{ fontFamily: 'monospace', fontSize: '10px', color: analysis.confidence.color, fontWeight: 700 }}>
                {analysis.confidence.label}
              </span>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--muted)', marginTop: '6px' }}>
              {analysis.confidence.tip}
            </div>
          </div>

          {/* Range breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              background: 'var(--surface)', borderRadius: '10px', padding: '16px', textAlign: 'center',
              border: '1px solid rgba(74,222,128,0.2)',
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1.5px', color: '#4ade80', marginBottom: '6px' }}>🚀 OPTIMISTIC</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', color: '#4ade80' }}>{fmtTime(analysis.optimistic)}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--muted)', marginTop: '2px' }}>Peak day — everything clicks</div>
            </div>
            <div style={{
              background: 'var(--surface)', borderRadius: '10px', padding: '16px', textAlign: 'center',
              border: '1px solid rgba(251,146,60,0.2)',
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1.5px', color: '#fb923c', marginBottom: '6px' }}>🛡️ CONSERVATIVE</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', color: '#fb923c' }}>{fmtTime(analysis.conservative)}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--muted)', marginTop: '2px' }}>Safe target — solid finish</div>
            </div>
          </div>

          {/* Training data used */}
          <div style={{
            background: 'var(--surface)', borderRadius: '10px', padding: '16px',
            border: '1px solid var(--border)', marginBottom: '20px',
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '2px', color: 'var(--muted)', marginBottom: '12px' }}>
              TRAINING DATA USED (LAST 90 DAYS)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: 'var(--accent)' }}>{analysis.runCount}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '8px', color: 'var(--muted)', letterSpacing: '1px' }}>RUNS ANALYSED</div>
              </div>
              <div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: 'var(--accent)' }}>
                  {analysis.longestRun.distanceKm.toFixed(1)}km
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '8px', color: 'var(--muted)', letterSpacing: '1px' }}>LONGEST RUN</div>
              </div>
              <div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: 'var(--accent)' }}>
                  {analysis.bestPaceRun ? fmtPace(analysis.bestPaceRun.paceSecPerKm) : '—'}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '8px', color: 'var(--muted)', letterSpacing: '1px' }}>BEST PACE</div>
              </div>
            </div>
          </div>

          {/* Manual pace override */}
          <div style={{
            background: 'var(--surface)', borderRadius: '10px', padding: '16px',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '2px', color: 'var(--muted)', marginBottom: '10px' }}>
              🎯 GOAL PACE OVERRIDE — "what if I run MM:SS/km?"
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="e.g. 5:30"
                value={manualPace}
                onChange={e => setManualPace(e.target.value)}
                style={{
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '10px 14px',
                  fontFamily: 'monospace', fontSize: '14px', color: 'var(--text)',
                  width: '100px',
                }}
              />
              {manualPrediction && (
                <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#4ade80', fontWeight: 700 }}>
                  → {fmtTime(manualPrediction)}
                </div>
              )}
              {manualPace && !manualPrediction && (
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)' }}>
                  Enter pace as MM:SS
                </div>
              )}
              {manualPace && (
                <button
                  onClick={() => setManualPace('')}
                  style={{
                    background: 'transparent', border: '1px solid var(--border)',
                    borderRadius: '6px', padding: '6px 12px',
                    color: 'var(--muted)', fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--muted)', marginTop: '8px' }}>
              See what finish time you'd get at a specific goal pace — great for race planning.
            </div>
          </div>

          {/* Formula note */}
          <div style={{
            marginTop: '16px', fontFamily: 'monospace', fontSize: '9px',
            color: 'var(--muted)', textAlign: 'center', letterSpacing: '0.5px',
          }}>
            Riegel formula: T2 = T1 × (D2/D1)^1.06 · Blended with your average pace · Same method used by Strava &amp; Garmin
          </div>
        </>
      )}
    </div>
  )
}
