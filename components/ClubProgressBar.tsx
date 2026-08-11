"use client"

import React from 'react'

interface ClubProgressBarProps {
  totalKm: number
  totalTarget: number
  weeksLeft: number
  totalRuns: number
  activeRunners: number
}

export default function ClubProgressBar({ totalKm, totalTarget, weeksLeft, totalRuns, activeRunners }: ClubProgressBarProps) {
  const pct = totalTarget > 0 ? Math.min(100, Math.round((totalKm / totalTarget) * 100)) : 0
  const kmLeft = Math.max(0, totalTarget - totalKm)

  // Animated bar - simple CSS approach
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '48px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', letterSpacing: '1px', marginBottom: '4px' }}>
            🏃 Club Race Mission
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px' }}>
            COLLECTIVE KM ACROSS ALL {activeRunners} RUNNERS · {weeksLeft} WEEKS TO RACE DAY
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.4rem', color: 'var(--accent)', lineHeight: 1 }}>
            {pct}%
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--muted)', letterSpacing: '2px' }}>COMPLETE</div>
        </div>
      </div>

      {/* Big progress bar */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <div style={{ height: '24px', background: 'var(--bg)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--accent)' : 'var(--yellow)',
            borderRadius: '12px',
            transition: 'width 1s ease',
            position: 'relative',
            boxShadow: pct >= 80 ? '0 0 20px rgba(74,222,128,0.4)' : `0 0 20px rgba(252,76,2,0.3)`,
          }}>
            {/* Animated shimmer */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
              animation: 'shimmer 2s infinite',
            }} />
          </div>
        </div>
        {/* Milestone marker at 50% */}
        <div style={{
          position: 'absolute', top: '-4px', left: '50%', transform: 'translateX(-50%)',
          width: '2px', height: '32px', background: 'var(--border)',
        }} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'KM LOGGED', value: Math.round(totalKm).toLocaleString(), color: 'var(--accent)' },
          { label: 'KM TARGET', value: Math.round(totalTarget).toLocaleString(), color: 'var(--text)' },
          { label: 'KM LEFT', value: Math.round(kmLeft).toLocaleString(), color: kmLeft > 500 ? 'var(--yellow)' : 'var(--green)' },
          { label: 'TOTAL RUNS', value: totalRuns.toLocaleString(), color: 'var(--blue)' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '8px', color: 'var(--muted)', letterSpacing: '1px' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
