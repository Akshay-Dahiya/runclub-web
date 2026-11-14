"use client"

import React from 'react'

interface ClubProgressBarProps {
  totalKm: number
  totalRuns: number
  activeRunners: number
}

export default function ClubProgressBar({ totalKm, totalRuns, activeRunners }: ClubProgressBarProps) {
  const averageDistance = totalRuns > 0 ? totalKm / totalRuns : null
  const averageKmPerRunner = activeRunners > 0 ? totalKm / activeRunners : null
  const stats = [
    { label: 'RUNS LOGGED', value: totalRuns.toLocaleString(), color: '#0284C7' },
    { label: 'CONNECTED RUNNERS', value: activeRunners.toLocaleString(), color: '#16A34A' },
    { label: 'AVERAGE DISTANCE', value: averageDistance === null ? '—' : `${averageDistance.toFixed(1)} km`, color: '#0F172A' },
    { label: 'AVG KM / RUNNER', value: averageKmPerRunner === null ? '—' : `${averageKmPerRunner.toFixed(1)} km`, color: '#FC4C02' },
  ]

  return (
    <section
      aria-labelledby="community-mileage-title"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '20px',
        padding: 'clamp(18px, 5vw, 32px)',
        marginBottom: '48px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '22px' }}>
        <div style={{ minWidth: 0, flex: '1 1 170px' }}>
          <p style={{ margin: '0 0 6px', fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, letterSpacing: '1.4px', color: '#FC4C02' }}>
            COMMUNITY SNAPSHOT
          </p>
          <h2 id="community-mileage-title" style={{ margin: 0, color: '#0F172A', fontSize: 'clamp(1.2rem, 5vw, 1.5rem)', fontWeight: 800, lineHeight: 1.2 }}>
            Every run adds up
          </h2>
          <p style={{ margin: '6px 0 0', color: '#64748B', fontSize: '12px', lineHeight: 1.5 }}>
            Shared miles across connected runners.
          </p>
        </div>
        <div style={{ flex: '0 1 auto', textAlign: 'right' }}>
          <p style={{ margin: 0, color: '#FC4C02', fontSize: 'clamp(1.8rem, 8vw, 2.5rem)', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {totalKm.toLocaleString('en-US', { maximumFractionDigits: 1 })}
          </p>
          <p style={{ margin: '5px 0 0', color: '#64748B', fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, letterSpacing: '1px' }}>
            KM LOGGED
          </p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ minWidth: 0, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '13px 10px', textAlign: 'center' }}>
            <p style={{ margin: 0, color: stat.color, fontSize: '1.25rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}>
              {stat.value}
            </p>
            <p style={{ margin: '4px 0 0', color: '#64748B', fontFamily: 'monospace', fontSize: '9px', fontWeight: 600, letterSpacing: '0.4px', lineHeight: 1.4 }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
