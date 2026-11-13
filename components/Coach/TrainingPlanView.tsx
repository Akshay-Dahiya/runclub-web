"use client"

import React, { useState } from 'react'
import { fmtTime, fmtPace } from '../../lib/race-predictor'

interface TrainingPlanViewProps {
  plan: any
  onWorkoutUpdated?: () => void
}

export default function TrainingPlanView({ plan, onWorkoutUpdated }: TrainingPlanViewProps) {
  const planData = plan?.planData
  const weeks = planData?.weeks || []
  const paceZones = planData?.paceZones

  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(plan?.currentWeek || 1)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showRpeModal, setShowRpeModal] = useState<{ weekNumber: number; dayOfWeek: string } | null>(null)
  const [rpeScore, setRpeScore] = useState<number>(6)
  const [rpeNotes, setRpeNotes] = useState<string>('')

  if (!planData || weeks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontFamily: 'monospace' }}>
        No training plan active. Complete the onboarding questionnaire to generate your plan.
      </div>
    )
  }

  const selectedWeek = weeks.find((w: any) => w.weekNumber === selectedWeekNum) || weeks[0]

  const handleUpdateStatus = async (weekNumber: number, dayOfWeek: string, newStatus: string, rpe?: number, notes?: string) => {
    const key = `${weekNumber}-${dayOfWeek}`
    setUpdatingId(key)
    try {
      const res = await fetch('/api/coach/plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          weekNumber,
          dayOfWeek,
          status: newStatus,
          perceivedEffort: rpe,
          runnerNotes: notes,
        }),
      })
      if (!res.ok) throw new Error('Failed to update workout')
      if (onWorkoutUpdated) onWorkoutUpdated()
    } catch (err: any) {
      alert(err.message || 'Error updating workout')
    } finally {
      setUpdatingId(null)
      setShowRpeModal(null)
    }
  }

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'intervals': return '#ef4444'
      case 'tempo': return '#facc15'
      case 'long': return '#22d3ee'
      case 'easy': return '#4ade80'
      case 'strength': return '#a78bfa'
      case 'rest': return '#64748b'
      default: return 'var(--accent)'
    }
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '28px',
      marginBottom: '32px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--accent)', letterSpacing: '2px', textTransform: 'uppercase' }}>
            // Module 3 · Personalized Training Schedule
          </span>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', letterSpacing: '1px', margin: '4px 0 0 0' }}>
            {plan.goalRace} Training Plan ({plan.weeksTotal} Weeks)
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '12px', margin: '4px 0 0 0' }}>
            Target: <strong style={{ color: 'var(--text)' }}>{fmtTime(plan.goalTimeSec)}</strong> · Peak Weekly Volume: {planData.peakWeeklyKm} km
          </p>
        </div>

        {/* Pace Zones Quick Reference Pill */}
        {paceZones && (
          <div style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '8px 14px',
            display: 'flex',
            gap: '14px',
            fontFamily: 'monospace',
            fontSize: '11px',
            flexWrap: 'wrap'
          }}>
            <div><span style={{ color: '#4ade80' }}>● Easy:</span> {fmtPace(paceZones.easy)}</div>
            <div><span style={{ color: '#facc15' }}>● Tempo:</span> {fmtPace(paceZones.tempo)}</div>
            <div><span style={{ color: '#ef4444' }}>● Interval:</span> {fmtPace(paceZones.interval)}</div>
          </div>
        )}
      </div>

      {/* Week Selector Bar */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px' }}>
        {weeks.map((w: any) => {
          const isSelected = w.weekNumber === selectedWeekNum
          return (
            <button
              key={w.weekNumber}
              onClick={() => setSelectedWeekNum(w.weekNumber)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                background: isSelected ? 'var(--accent)' : 'var(--bg)',
                color: isSelected ? '#000' : 'var(--text)',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 700,
                whiteSpace: 'nowrap'
              }}
            >
              Wk {w.weekNumber} ({w.totalKmTarget}k)
            </button>
          )
        })}
      </div>

      {/* Week Overview Card */}
      <div style={{
        background: 'rgba(252,76,2,0.05)',
        border: '1px solid rgba(252,76,2,0.2)',
        borderRadius: '10px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            WEEK {selectedWeek.weekNumber} FOCUS · {selectedWeek.weekType.toUpperCase()}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>
            {selectedWeek.weekFocus}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', color: 'var(--accent)', lineHeight: 1 }}>
            {selectedWeek.totalKmTarget} KM
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--muted)' }}>
            TARGET VOLUME
          </div>
        </div>
      </div>

      {/* Workouts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '16px' }}>
        {selectedWeek.workouts.map((wo: any, idx: number) => {
          const badgeColor = getBadgeColor(wo.type)
          const isDone = wo.status === 'done'
          const itemKey = `${selectedWeek.weekNumber}-${wo.dayOfWeek}`
          const isUpdating = updatingId === itemKey

          return (
            <div
              key={idx}
              style={{
                background: 'var(--bg)',
                border: `1px solid ${isDone ? '#4ade8040' : 'var(--border)'}`,
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                transition: 'border-color 0.2s',
              }}
            >
              <div>
                {/* Workout Top Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem', color: 'var(--text)' }}>
                      {wo.dayOfWeek}
                    </span>
                    <span style={{
                      background: `${badgeColor}20`,
                      color: badgeColor,
                      border: `1px solid ${badgeColor}40`,
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontFamily: 'monospace',
                      fontSize: '9px',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      {wo.type}
                    </span>
                  </div>

                  {/* Status Pill */}
                  {isDone ? (
                    <span style={{ color: '#4ade80', fontFamily: 'monospace', fontSize: '11px', fontWeight: 700 }}>
                      ✓ Completed
                    </span>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontFamily: 'monospace', fontSize: '11px' }}>
                      Planned
                    </span>
                  )}
                </div>

                {/* Main Workout Description */}
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                  {wo.mainDesc}
                </div>

                {/* Target Metric Stats */}
                <div style={{ display: 'flex', gap: '14px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '12px' }}>
                  {wo.distanceKm && <div>📏 <strong>{wo.distanceKm} km</strong></div>}
                  {wo.targetPaceSec && <div>⏱️ <strong>{fmtPace(wo.targetPaceSec)}</strong></div>}
                  {wo.effortZone && <div>❤️ <strong>Zone {wo.effortZone}</strong></div>}
                  {wo.durationMin && <div>⌛ <strong>~{wo.durationMin}m</strong></div>}
                </div>

                {/* Purpose of the session */}
                <div style={{
                  background: 'var(--surface)',
                  borderLeft: `2px solid ${badgeColor}`,
                  borderRadius: '0 6px 6px 0',
                  padding: '8px 12px',
                  fontSize: '11px',
                  color: 'var(--muted)',
                  lineHeight: 1.5,
                  marginBottom: '12px'
                }}>
                  {wo.purpose}
                </div>

                {/* Step Instructions */}
                {wo.instructions && wo.instructions.length > 0 && (
                  <ul style={{ margin: '0 0 12px 0', paddingLeft: '16px', fontSize: '11px', color: 'var(--muted)', lineHeight: 1.5 }}>
                    {wo.instructions.slice(0, 3).map((inst: string, i: number) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ul>
                )}

                {/* Runner RPE Note if completed */}
                {wo.perceivedEffort && (
                  <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4ade80', marginBottom: '8px' }}>
                    Runner RPE: {wo.perceivedEffort}/10 {wo.runnerNotes ? `· "${wo.runnerNotes}"` : ''}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                {!isDone ? (
                  <button
                    disabled={isUpdating}
                    onClick={() => setShowRpeModal({ weekNumber: selectedWeek.weekNumber, dayOfWeek: wo.dayOfWeek })}
                    style={{
                      flex: 1,
                      background: 'var(--accent)',
                      color: '#000',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Log Completed ✓
                  </button>
                ) : (
                  <button
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(selectedWeek.weekNumber, wo.dayOfWeek, 'planned')}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      color: 'var(--muted)',
                      borderRadius: '6px',
                      padding: '8px',
                      fontFamily: 'monospace',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    Mark Incomplete
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* RPE & Feedback Modal */}
      {showRpeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>
              How did this workout feel?
            </h4>
            <p style={{ color: 'var(--muted)', fontSize: '11px', margin: '0 0 16px 0' }}>
              Rate your Perceived Exertion (RPE). This allows the adaptive coach to adjust upcoming volume.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '11px', marginBottom: '6px' }}>
                <span>Rate Effort:</span>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{rpeScore} / 10 ({
                  rpeScore <= 3 ? 'Very Easy' :
                  rpeScore <= 5 ? 'Comfortable' :
                  rpeScore <= 7 ? 'Hard' :
                  rpeScore <= 9 ? 'Very Hard' : 'Max Effort'
                })</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={rpeScore}
                onChange={e => setRpeScore(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '10px', color: 'var(--muted)', marginBottom: '4px' }}>
                NOTES OR DISCOMFORT (OPTIONAL)
              </label>
              <input
                type="text"
                placeholder="e.g. felt smooth, or slight tightness in left calf"
                value={rpeNotes}
                onChange={e => setRpeNotes(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '10px',
                  color: 'var(--text)',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowRpeModal(null)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--muted)',
                  padding: '10px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(showRpeModal.weekNumber, showRpeModal.dayOfWeek, 'done', rpeScore, rpeNotes)}
                style={{
                  flex: 1,
                  background: 'var(--accent)',
                  color: '#000',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Save Workout ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
