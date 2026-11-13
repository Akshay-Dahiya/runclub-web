"use client"

import React, { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

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

function formatPace(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return '—'
  const roundedSeconds = Math.round(seconds)
  const minutes = Math.floor(roundedSeconds / 60)
  const remainder = String(roundedSeconds % 60).padStart(2, '0')
  return `${minutes}:${remainder}/km`
}

function formatDistance(distance: number) {
  return `${distance.toFixed(1)} km`
}

export default function PerformanceCharts({ runs = [] }: PerformanceChartsProps) {
  const [activeTab, setActiveTab] = useState<'volume' | 'pace'>('volume')

  const { weeklyData, highlights, hasWeeklyRuns } = useMemo(() => {
    const validRuns = runs
      .map((run) => {
        const date = new Date(run.date)
        const distanceKm = Number(run.distanceKm)
        const reportedPace = Number(run.paceSecPerKm)
        const paceSecPerKm = reportedPace > 0
          ? reportedPace
          : Number(run.durationSec) / distanceKm

        return { ...run, date, distanceKm, paceSecPerKm }
      })
      .filter((run) => Number.isFinite(run.date.getTime()) && run.distanceKm > 0)
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    const today = new Date()
    const currentWeekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    currentWeekStart.setDate(currentWeekStart.getDate() - ((currentWeekStart.getDay() + 6) % 7))

    const weeklyData = Array.from({ length: 8 }, (_, index) => {
      const weekStart = new Date(currentWeekStart)
      weekStart.setDate(currentWeekStart.getDate() - (7 - index) * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)

      const weekRuns = validRuns.filter((run) => run.date >= weekStart && run.date < weekEnd)
      const distanceKm = weekRuns.reduce((total, run) => total + run.distanceKm, 0)
      const pacedRuns = weekRuns.filter((run) => run.paceSecPerKm > 150 && run.paceSecPerKm < 900)
      const pacedDistance = pacedRuns.reduce((total, run) => total + run.distanceKm, 0)
      const avgPaceSecPerKm = pacedDistance > 0
        ? pacedRuns.reduce((total, run) => total + run.paceSecPerKm * run.distanceKm, 0) / pacedDistance
        : undefined

      return {
        label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        distanceKm: Math.round(distanceKm * 10) / 10,
        avgPaceSecPerKm,
      }
    })

    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    const recentRuns = validRuns.filter((run) => run.date >= thirtyDaysAgo)
    const recentDistance = recentRuns.reduce((total, run) => total + run.distanceKm, 0)
    const longestRun = recentRuns.reduce((longest, run) => Math.max(longest, run.distanceKm), 0)
    const recentPacedRuns = recentRuns.filter((run) => run.paceSecPerKm > 150 && run.paceSecPerKm < 900)
    const recentPacedDistance = recentPacedRuns.reduce((total, run) => total + run.distanceKm, 0)
    const averagePace = recentPacedDistance > 0
      ? recentPacedRuns.reduce((total, run) => total + run.paceSecPerKm * run.distanceKm, 0) / recentPacedDistance
      : undefined

    return {
      weeklyData,
      hasWeeklyRuns: weeklyData.some((week) => week.distanceKm > 0),
      highlights: [
        {
          label: 'DISTANCE · 30 DAYS',
          value: recentRuns.length > 0 ? formatDistance(recentDistance) : '—',
          detail: 'Recent training volume',
        },
        {
          label: 'LONGEST · 30 DAYS',
          value: longestRun > 0 ? formatDistance(longestRun) : '—',
          detail: 'Longest activity',
        },
        {
          label: 'AVERAGE PACE · 30 DAYS',
          value: formatPace(averagePace),
          detail: 'Distance-weighted pace',
        },
      ],
    }
  }, [runs])

  const chartCardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '20px',
    padding: 'clamp(18px, 3.5vw, 32px)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
    marginBottom: '32px',
  }

  const chartColors = {
    orange: '#FC4C02',
    blue: '#0284C7',
    grid: '#E2E8F0',
    text: '#64748B',
    dark: '#0F172A',
  }

  return (
    <section aria-labelledby="performance-title" style={chartCardStyle}>
      <header style={{ marginBottom: '24px' }}>
        <h3 id="performance-title" style={{ margin: 0, color: chartColors.dark, fontSize: '1.4rem', fontWeight: 800 }}>
          Performance
        </h3>
        <p style={{ margin: '6px 0 0', color: chartColors.text, fontSize: '13px' }}>
          Follow your training volume and pace over time.
        </p>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '12px',
        marginBottom: '28px',
      }}>
        {highlights.map((highlight) => (
          <article key={highlight.label} style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '16px 18px',
          }}>
            <p style={{ margin: 0, color: chartColors.text, fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, letterSpacing: '0.4px' }}>
              {highlight.label}
            </p>
            <p style={{ margin: '8px 0 2px', color: chartColors.dark, fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.15 }}>
              {highlight.value}
            </p>
            <p style={{ margin: 0, color: chartColors.text, fontSize: '11px' }}>{highlight.detail}</p>
          </article>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h4 style={{ margin: 0, color: chartColors.dark, fontSize: '1.05rem', fontWeight: 750 }}>
            {activeTab === 'volume' ? 'Weekly distance' : 'Weekly average pace'}
          </h4>
          <p style={{ margin: '4px 0 0', color: chartColors.text, fontSize: '12px' }}>
            Last 8 weeks · current week is still in progress
          </p>
        </div>

        <div role="group" aria-label="Performance chart view" style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
          {(['volume', 'pace'] as const).map((tab) => {
            const selected = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                aria-pressed={selected}
                onClick={() => setActiveTab(tab)}
                style={{
                  border: 'none',
                  borderRadius: '7px',
                  padding: '8px 12px',
                  background: selected ? '#FFFFFF' : 'transparent',
                  color: selected ? chartColors.orange : chartColors.text,
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: selected ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {tab === 'volume' ? 'Distance' : 'Pace'}
              </button>
            )
          })}
        </div>
      </div>

      {!hasWeeklyRuns ? (
        <div role="status" style={{
          display: 'grid',
          placeItems: 'center',
          minHeight: '240px',
          padding: '24px',
          border: '1px dashed #CBD5E1',
          borderRadius: '14px',
          color: chartColors.text,
          textAlign: 'center',
          fontSize: '14px',
        }}>
          Sync recent Strava activities to see your performance trends.
        </div>
      ) : activeTab === 'volume' ? (
        <div role="img" aria-label="Bar chart showing weekly running distance for the last eight weeks" style={{ width: '100%', height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 10, right: 8, left: 0, bottom: 12 }}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: chartColors.text, fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={8} />
              <YAxis tick={{ fill: chartColors.text, fontSize: 11 }} tickLine={false} axisLine={false} width={48} tickFormatter={(value) => `${value} km`} />
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(1)} km`, 'Distance']}
                labelFormatter={(label) => `Week of ${label}`}
                contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(15,23,42,0.12)' }}
              />
              <Bar dataKey="distanceKm" name="Distance" fill={chartColors.orange} radius={[6, 6, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        weeklyData.some((week) => week.avgPaceSecPerKm !== undefined) ? (
          <div role="img" aria-label="Line chart showing average running pace for the last eight weeks; a faster pace is higher on the chart" style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData} margin={{ top: 10, right: 16, left: 0, bottom: 12 }}>
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: chartColors.text, fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={8} />
                <YAxis
                  reversed
                  domain={['dataMin - 15', 'dataMax + 15']}
                  width={52}
                  tick={{ fill: chartColors.text, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatPace(Number(value))}
                />
                <Tooltip
                  formatter={(value) => [formatPace(Number(value)), 'Average pace']}
                  labelFormatter={(label) => `Week of ${label}`}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(15,23,42,0.12)' }}
                />
                <Line dataKey="avgPaceSecPerKm" name="Average pace" type="monotone" stroke={chartColors.blue} strokeWidth={3} connectNulls dot={{ r: 4, fill: chartColors.blue, strokeWidth: 2, stroke: '#FFFFFF' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div role="status" style={{
            display: 'grid',
            placeItems: 'center',
            minHeight: '240px',
            padding: '24px',
            border: '1px dashed #CBD5E1',
            borderRadius: '14px',
            color: chartColors.text,
            textAlign: 'center',
            fontSize: '14px',
          }}>
            Sync a few recent runs with valid pace data to see your pace trend.
          </div>
        )
      )}
    </section>
  )
}
