"use client"

import React, { useState, useMemo } from 'react'

interface Run {
  id: string
  distanceKm: number
  durationSec: number
  paceSecPerKm: number
  avgHeartRate?: number | null
  date: string
}

interface PerformanceChartsProps {
  runs: Run[]
}

function fmtPace(sec: number) {
  if (!sec || isNaN(sec)) return '—'
  const m = Math.floor(sec / 60)
  const s = String(Math.round(sec % 60)).padStart(2, '0')
  return `${m}:${s}/km`
}

export default function PerformanceCharts({ runs = [] }: PerformanceChartsProps) {
  const [activeTab, setActiveTab] = useState<'volume' | 'pace'>('volume')

  // Calculate Last 8 Weeks volume data
  const weekData = useMemo(() => {
    const now = new Date()
    const weeks: Array<{
      label: string
      km: number
      runCount: number
      type: 'build' | 'maintain' | 'recovery'
    }> = []

    for (let i = 7; i >= 0; i--) {
      const end = new Date(now.getTime() - i * 7 * 24 * 3600 * 1000)
      const start = new Date(end.getTime() - 7 * 24 * 3600 * 1000)

      const weekRuns = runs.filter(r => {
        const d = new Date(r.date)
        return d >= start && d < end
      })

      const km = Math.round(weekRuns.reduce((sum, r) => sum + (r.distanceKm || 0), 0) * 10) / 10
      const label = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      weeks.push({ label, km, runCount: weekRuns.length, type: 'maintain' })
    }

    // Determine build / maintain / recovery based on comparison with previous week
    return weeks.map((w, idx) => {
      if (idx === 0) return { ...w, type: 'maintain' }
      const prev = weeks[idx - 1].km
      if (w.km > prev * 1.08 && w.km > 5) return { ...w, type: 'build' as const }
      if (w.km < prev * 0.85 && prev > 10) return { ...w, type: 'recovery' as const }
      return { ...w, type: 'maintain' as const }
    })
  }, [runs])

  // Calculate monthly highlights
  const highlights = useMemo(() => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000)
    const recent = runs.filter(r => new Date(r.date) >= thirtyDaysAgo)

    const longestRun = recent.length > 0 ? Math.max(...recent.map(r => r.distanceKm || 0)) : 0
    const fastestPace = recent.length > 0 
      ? Math.min(...recent.filter(r => r.paceSecPerKm > 120).map(r => r.paceSecPerKm))
      : 0
    const totalKm30 = recent.reduce((sum, r) => sum + (r.distanceKm || 0), 0)
    const avgWeeklyKm = Math.round((totalKm30 / 4.28) * 10) / 10

    return {
      longestRun: longestRun.toFixed(1),
      fastestPace: fastestPace > 0 ? fmtPace(fastestPace) : '—',
      avgWeeklyKm: avgWeeklyKm.toFixed(1),
      totalRunsMonth: recent.length,
      totalAllTimeKm: Math.round(runs.reduce((sum, r) => sum + (r.distanceKm || 0), 0))
    }
  }, [runs])

  // Max km for scaling bar chart
  const maxKm = Math.max(15, ...weekData.map(w => w.km))

  // Recent pace data for trend line
  const paceHistory = useMemo(() => {
    return runs
      .filter(r => r.paceSecPerKm > 150 && r.paceSecPerKm < 900)
      .slice(0, 16)
      .reverse()
      .map((r, i) => ({
        index: i + 1,
        date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pace: r.paceSecPerKm,
        paceFormatted: fmtPace(r.paceSecPerKm),
        km: r.distanceKm
      }))
  }, [runs])

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '20px',
      padding: '32px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
      marginBottom: '32px'
    }}>
      {/* Highlights Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '12px',
        marginBottom: '28px'
      }}>
        {[
          { label: 'LONGEST RUN (30D)', val: `${highlights.longestRun} km`, sub: 'Peak Endurance', color: '#FC4C02', icon: '🏔️' },
          { label: 'AVG WEEKLY VOLUME', val: `${highlights.avgWeeklyKm} km`, sub: 'Current Baseline', color: '#0284C7', icon: '📈' },
          { label: 'BEST TRAINING PACE', val: highlights.fastestPace, sub: 'Top Speed', color: '#16A34A', icon: '⚡' },
          { label: 'RUNS THIS MONTH', val: `${highlights.totalRunsMonth}`, sub: 'Consistency', color: '#F59E0B', icon: '🔥' },
        ].map((h, i) => (
          <div key={i} style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '16px 18px',
            transition: 'transform 0.15s, border-color 0.15s'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.1rem' }}>{h.icon}</span>
              <span style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, color: '#64748B', letterSpacing: '0.5px' }}>
                {h.label}
              </span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
              {h.val}
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
              {h.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            {activeTab === 'volume' ? 'Weekly Volume Progression (Last 8 Weeks)' : 'Pace Consistency & Aerobic Engine'}
          </h4>
          <p style={{ color: '#64748B', fontSize: '12px', margin: '4px 0 0 0' }}>
            {activeTab === 'volume' 
              ? 'Tracking weekly distance to safely build aerobic capacity.'
              : 'Remember: Easy pace builds your engine — 80% of your runs should feel slow & conversational.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px', background: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
          <button
            onClick={() => setActiveTab('volume')}
            style={{
              background: activeTab === 'volume' ? '#FFFFFF' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              color: activeTab === 'volume' ? '#FC4C02' : '#64748B',
              cursor: 'pointer',
              boxShadow: activeTab === 'volume' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            📊 Weekly Volume
          </button>
          <button
            onClick={() => setActiveTab('pace')}
            style={{
              background: activeTab === 'pace' ? '#FFFFFF' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              color: activeTab === 'pace' ? '#FC4C02' : '#64748B',
              cursor: 'pointer',
              boxShadow: activeTab === 'pace' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            ⚡ Pace Trend
          </button>
        </div>
      </div>

      {/* ── 1. Weekly Volume Bar Chart ── */}
      {activeTab === 'volume' && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '12px',
            height: '200px',
            paddingTop: '20px',
            borderBottom: '1px solid #E2E8F0',
            marginBottom: '16px'
          }}>
            {weekData.map((w, idx) => {
              const heightPct = Math.max(6, Math.min(100, Math.round((w.km / maxKm) * 100)))
              const color = w.type === 'build' ? '#FC4C02' : w.type === 'recovery' ? '#0284C7' : '#16A34A'
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                    {w.km > 0 ? `${w.km}k` : '—'}
                  </div>
                  <div style={{
                    width: '100%',
                    maxWidth: '38px',
                    height: `${heightPct}%`,
                    background: w.km > 0 ? color : '#E2E8F0',
                    borderRadius: '8px 8px 3px 3px',
                    transition: 'height 0.4s ease',
                    boxShadow: w.km > 0 ? `0 4px 12px ${color}33` : 'none'
                  }} />
                  <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#64748B', marginTop: '8px', textAlign: 'center' }}>
                    {w.label}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '11px', color: '#64748B', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#FC4C02' }} />
              <span>Build Week (+Volume)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#16A34A' }} />
              <span>Maintain Week (Steady)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#0284C7' }} />
              <span>Recovery Week (Absorb)</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Pace Trend Chart ── */}
      {activeTab === 'pace' && (
        <div>
          {paceHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontSize: '13px' }}>
              Log or sync a few runs to see your pace progression trend line.
            </div>
          ) : (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '8px',
                marginBottom: '16px'
              }}>
                {paceHistory.slice(-8).map((p, idx) => (
                  <div key={idx} style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '10px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '2px' }}>{p.date} · {p.km}km</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#FC4C02' }}>{p.paceFormatted}</div>
                  </div>
                ))}
              </div>

              {/* Slow-to-Fast Coaching Callout */}
              <div style={{
                background: '#EFF6FF',
                borderLeft: '4px solid #0284C7',
                borderRadius: '0 10px 10px 0',
                padding: '12px 16px',
                fontSize: '12px',
                color: '#1E3A8A',
                lineHeight: 1.5
              }}>
                💡 <strong>The Golden Rule:</strong> Running slow is not a sign of weakness; it is the scientific trigger that grows mitochondria, heart stroke volume, and capillary density. Run 80% of your miles so easy that you can chat effortlessly.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
