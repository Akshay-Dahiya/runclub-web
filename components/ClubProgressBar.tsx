"use client"

import React from 'react'

interface ClubProgressBarProps {
  totalKm: number
  totalTarget: number
  weeksLeft?: number
  totalRuns: number
  activeRunners: number
}

export default function ClubProgressBar({ totalKm, totalTarget, totalRuns, activeRunners }: ClubProgressBarProps) {
  const target = Math.max(totalTarget, 2000)
  const pct = target > 0 ? Math.min(100, Math.round((totalKm / target) * 100)) : 0
  const kmLeft = Math.max(0, target - totalKm)

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '20px',
      padding: '32px',
      marginBottom: '48px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.04)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
            🏃 Collective Community Mileage
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#64748B', letterSpacing: '0.5px' }}>
            EVERY MILE FROM EVERY RUNNER COUNTS · {activeRunners} CONNECTED RUNNERS
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FC4C02', lineHeight: 1 }}>
            {pct}%
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#64748B', letterSpacing: '1px', fontWeight: 700 }}>
            COMMUNITY TARGET
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <div style={{ height: '20px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #FC4C02 0%, #F59E0B 100%)',
            borderRadius: '10px',
            transition: 'width 1s ease',
            position: 'relative',
            boxShadow: '0 2px 10px rgba(252,76,2,0.3)'
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
              animation: 'shimmer 2s infinite',
            }} />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'KM LOGGED', value: Math.round(totalKm).toLocaleString(), color: '#FC4C02' },
          { label: 'COMMUNITY GOAL', value: Math.round(target).toLocaleString(), color: '#0F172A' },
          { label: 'KM REMAINING', value: Math.round(kmLeft).toLocaleString(), color: '#16A34A' },
          { label: 'RUNS LOGGED', value: totalRuns.toLocaleString(), color: '#0284C7' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center', background: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#64748B', letterSpacing: '0.5px', marginTop: '2px', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
