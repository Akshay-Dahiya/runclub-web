"use client"

import React, { useState } from 'react'
import { GoalAnalysis, GoalTier, analyseGoal } from '../../lib/goal-setter'
import { fmtTime, fmtPace } from '../../lib/race-predictor'

interface GoalSetterCardProps {
  analysis: GoalAnalysis
  selectedTierLabel?: string
  onSelectTier?: (tier: GoalTier) => void
  isSubmitting?: boolean
}

export default function GoalSetterCard({
  analysis,
  selectedTierLabel = 'Realistic',
  onSelectTier,
  isSubmitting = false,
}: GoalSetterCardProps) {
  const [activeTier, setActiveTier] = useState<string>(selectedTierLabel)

  const currentTier = analysis.tiers.find(t => t.label === activeTier) || analysis.tiers[1]

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '28px',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--accent)', letterSpacing: '2px', textTransform: 'uppercase' }}>
            // Module 2 · Intelligent Goal Setter
          </span>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', letterSpacing: '1px', margin: '4px 0 0 0' }}>
            Goal Feasibility &amp; Target Tiers
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '12px', margin: '4px 0 0 0' }}>
            Targeting {analysis.raceName} ({analysis.raceKm} km) · Stated Goal: {fmtTime(analysis.goalSec)}
          </p>
        </div>

        {/* Feasibility pill */}
        <div style={{
          padding: '6px 14px',
          borderRadius: '20px',
          border: `1px solid ${
            analysis.goalFeasibility === 'already_there' ? '#4ade80' :
            analysis.goalFeasibility === 'achievable' ? '#22d3ee' :
            analysis.goalFeasibility === 'ambitious' ? '#facc15' : '#fb923c'
          }`,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: analysis.goalFeasibility === 'already_there' ? '#4ade80' :
            analysis.goalFeasibility === 'achievable' ? '#22d3ee' :
            analysis.goalFeasibility === 'ambitious' ? '#facc15' : '#fb923c'
          }} />
          <span style={{
            fontFamily: 'monospace',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: analysis.goalFeasibility === 'already_there' ? '#4ade80' :
            analysis.goalFeasibility === 'achievable' ? '#22d3ee' :
            analysis.goalFeasibility === 'ambitious' ? '#facc15' : '#fb923c'
          }}>
            {analysis.goalFeasibility.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Feasibility Analysis Alert */}
      <div style={{
        background: 'rgba(0,0,0,0.2)',
        borderLeft: `3px solid ${
          analysis.goalFeasibility === 'already_there' ? '#4ade80' :
          analysis.goalFeasibility === 'achievable' ? '#22d3ee' :
          analysis.goalFeasibility === 'ambitious' ? '#facc15' : '#fb923c'
        }`,
        borderRadius: '0 8px 8px 0',
        padding: '12px 16px',
        marginBottom: '24px',
        fontSize: '12px',
        lineHeight: 1.6,
        color: 'var(--text)'
      }}>
        {analysis.feasibilityMessage}
      </div>

      {/* 3 Tier Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {analysis.tiers.map(tier => {
          const isSelected = activeTier === tier.label
          return (
            <div
              key={tier.label}
              onClick={() => setActiveTier(tier.label)}
              style={{
                background: isSelected ? 'rgba(252,76,2,0.08)' : 'var(--bg)',
                border: `2px solid ${isSelected ? tier.color : 'var(--border)'}`,
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>{tier.emoji}</span>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '9px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: tier.color,
                  letterSpacing: '1px'
                }}>
                  {tier.label}
                </span>
              </div>

              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: tier.color, lineHeight: 1, marginBottom: '4px' }}>
                {fmtTime(tier.timeSec)}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '12px' }}>
                @ {fmtPace(tier.paceSecPerKm)} pace
              </div>

              <p style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.5, minHeight: '33px', margin: '0 0 12px 0' }}>
                {tier.description}
              </p>

              <div style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: 'monospace',
                fontSize: '10px'
              }}>
                <span style={{ color: 'var(--muted)' }}>Target Volume:</span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>~{tier.weeklyKmRequired} km/wk</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Tier Action */}
      {onSelectTier && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg)',
          borderRadius: '10px',
          padding: '16px 20px',
          border: '1px solid var(--border)',
          marginBottom: '24px'
        }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--muted)' }}>
              SELECTED RACE TARGET
            </div>
            <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>
              {currentTier.label} Target: {fmtTime(currentTier.timeSec)} ({fmtPace(currentTier.paceSecPerKm)})
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onSelectTier(currentTier)}
            style={{
              background: 'var(--accent)',
              color: '#000',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '12px',
              fontWeight: 700,
              cursor: isSubmitting ? 'wait' : 'pointer'
            }}
          >
            {isSubmitting ? 'Updating...' : `Build Plan for ${currentTier.label} 🚀`}
          </button>
        </div>
      )}

      {/* Intermediate Milestones */}
      {analysis.milestones.length > 0 && (
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '1.5px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
            // Progressive Checkpoints &amp; Milestones
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            {analysis.milestones.map((m, idx) => (
              <div key={idx} style={{
                background: 'var(--bg)',
                borderRadius: '8px',
                padding: '12px 14px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '10px', color: 'var(--muted)', marginBottom: '4px' }}>
                  <span>Week {m.week}</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{fmtTime(m.targetTimeSec)}</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', lineHeight: 1.4 }}>
                  {m.note}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
