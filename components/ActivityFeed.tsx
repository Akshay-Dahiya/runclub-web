"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

interface Run {
  id: string
  distanceKm: number
  durationSec: number
  paceSecPerKm: number
  avgHeartRate: number | null
  date: string
  notes: string | null
  source: string
  user: {
    id: string
    name: string
    initials: string
  }
}

const AVATAR_COLORS = ['#FC4C02', '#22d3ee', '#4ade80', '#facc15', '#a78bfa', '#f472b6', '#fb923c', '#34d399', '#60a5fa', '#c084fc']

function fmtPace(sec: number) {
  const m = Math.floor(sec / 60)
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}/km`
}
function fmtDuration(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function RunCard({ run, index, onLike, likedIds }: { run: Run; index: number; onLike: (id: string) => void; likedIds: Set<string> }) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length]
  const isLiked = likedIds.has(run.id)
  const [likes, setLikes] = useState(0)

  const handleLike = () => {
    onLike(run.id)
    setLikes(l => isLiked ? l - 1 : l + 1)
  }

  const isStravaRun = run.source === 'strava'

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      transition: 'border-color 0.2s, transform 0.15s',
      animation: 'fadeSlideUp 0.4s ease both',
      animationDelay: `${index * 0.05}s`,
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href={`/dashboard/${run.user.id}`} style={{ textDecoration: 'none' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: color, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontFamily: 'monospace', fontSize: '11px',
            fontWeight: 700, color: '#000', flexShrink: 0, cursor: 'pointer',
            boxShadow: `0 0 0 2px ${color}33`
          }}>
            {run.user.initials}
          </div>
        </Link>
        <div style={{ flex: 1 }}>
          <Link href={`/dashboard/${run.user.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>{run.user.name}</div>
          </Link>
          <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace', display: 'flex', gap: '8px', alignItems: 'center' }}>
            {timeAgo(run.date)}
            {isStravaRun && (
              <span style={{
                background: 'rgba(252,76,2,0.15)', color: '#FC4C02',
                border: '1px solid rgba(252,76,2,0.4)',
                borderRadius: '4px', padding: '1px 6px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px'
              }}>STRAVA</span>
            )}
          </div>
        </div>
        {/* Distance badge — big highlight */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', color: 'var(--accent)', lineHeight: 1 }}>
            {run.distanceKm.toFixed(2)}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--muted)', letterSpacing: '1px' }}>KM</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {[
          { label: 'PACE', value: fmtPace(run.paceSecPerKm) },
          { label: 'TIME', value: fmtDuration(run.durationSec) },
          { label: 'HR', value: run.avgHeartRate ? `${run.avgHeartRate} bpm` : '—' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--surface)', borderRadius: '8px', padding: '10px',
            textAlign: 'center', border: '1px solid var(--border)'
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>{stat.value}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--muted)', letterSpacing: '1px', marginTop: '2px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {run.notes && (
        <div style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic', borderLeft: '2px solid var(--border)', paddingLeft: '10px' }}>
          {run.notes}
        </div>
      )}

      {/* Like / Reaction row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
        <button
          onClick={handleLike}
          style={{
            background: isLiked ? 'rgba(252,76,2,0.15)' : 'transparent',
            border: `1px solid ${isLiked ? '#FC4C02' : 'var(--border)'}`,
            borderRadius: '20px', padding: '5px 14px',
            color: isLiked ? '#FC4C02' : 'var(--muted)',
            fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.2s', fontFamily: 'monospace'
          }}
        >
          🔥 {isLiked ? 'Hyped' : 'Hype it'}
        </button>
        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)' }}>
          {likes > 0 ? `${likes} hype${likes !== 1 ? 's' : ''}` : ''}
        </span>
      </div>
    </div>
  )
}

export default function ActivityFeed() {
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'today' | 'week' | 'all'>('week')

  useEffect(() => {
    setLoading(true)
    fetch('/api/feed')
      .then(r => r.json())
      .then(data => {
        setRuns(data.runs || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7)

  const filteredRuns = runs.filter(r => {
    const d = new Date(r.date)
    if (filter === 'today') return d >= todayStart
    if (filter === 'week') return d >= weekStart
    return true
  })

  const handleLike = (id: string) => {
    setLikedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {(['today', 'week', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`tab-btn ${filter === f ? 'active' : ''}`}
          >
            {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'All Time'}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', alignSelf: 'center' }}>
          {filteredRuns.length} run{filteredRuns.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)', fontFamily: 'monospace' }}>
          Loading runs...
        </div>
      ) : filteredRuns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)', fontFamily: 'monospace' }}>
          No runs {filter === 'today' ? 'logged today' : filter === 'week' ? 'this week' : 'yet'} — go run! 🏃
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filteredRuns.map((run, i) => (
            <RunCard key={run.id} run={run} index={i} onLike={handleLike} likedIds={likedIds} />
          ))}
        </div>
      )}
    </div>
  )
}
