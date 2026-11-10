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

const AVATAR_COLORS = ['#FC4C02', '#0284C7', '#16A34A', '#F59E0B', '#8B5CF6', '#EC4899', '#EA580C', '#0D9488', '#2563EB', '#9333EA']

function fmtPace(sec: number) {
  if (!sec || isNaN(sec)) return '—'
  const m = Math.floor(sec / 60)
  const s = String(Math.round(sec % 60)).padStart(2, '0')
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
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
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
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '16px',
      padding: '22px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
      animation: 'fadeSlideUp 0.4s ease both',
      animationDelay: `${index * 0.04}s`,
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#FC4C02'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#E2E8F0'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.03)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href={`/dashboard/${run.user.id}`} style={{ textDecoration: 'none' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '50%',
            background: color, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontFamily: 'monospace', fontSize: '13px',
            fontWeight: 800, color: '#FFFFFF', flexShrink: 0, cursor: 'pointer',
            boxShadow: `0 2px 8px ${color}40`
          }}>
            {run.user.initials}
          </div>
        </Link>
        <div style={{ flex: 1 }}>
          <Link href={`/dashboard/${run.user.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0F172A', cursor: 'pointer' }}>
              {run.user.name}
            </div>
          </Link>
          <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', gap: '8px', alignItems: 'center' }}>
            {timeAgo(run.date)}
            {isStravaRun && (
              <span style={{
                background: 'rgba(252,76,2,0.1)', color: '#FC4C02',
                borderRadius: '6px', padding: '1px 7px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px'
              }}>STRAVA</span>
            )}
          </div>
        </div>
        {/* Distance badge */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FC4C02', lineHeight: 1 }}>
            {run.distanceKm.toFixed(2)}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#64748B', letterSpacing: '1px' }}>KM</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {[
          { label: 'PACE', value: fmtPace(run.paceSecPerKm) },
          { label: 'TIME', value: fmtDuration(run.durationSec) },
          { label: 'HEART RATE', value: run.avgHeartRate ? `${run.avgHeartRate} bpm` : '—' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: '#F8FAFC', borderRadius: '10px', padding: '10px',
            textAlign: 'center', border: '1px solid #E2E8F0'
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>{stat.value}</div>
            <div style={{ fontSize: '9px', color: '#64748B', letterSpacing: '0.5px', marginTop: '2px', fontWeight: 600 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {run.notes && (
        <div style={{ fontSize: '13px', color: '#475569', fontStyle: 'italic', borderLeft: '3px solid #CBD5E1', paddingLeft: '10px' }}>
          &ldquo;{run.notes}&rdquo;
        </div>
      )}

      {/* Like / Reaction row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
        <button
          onClick={handleLike}
          style={{
            background: isLiked ? '#FFF7ED' : '#F8FAFC',
            border: `1.5px solid ${isLiked ? '#FC4C02' : '#E2E8F0'}`,
            borderRadius: '20px', padding: '6px 16px',
            color: isLiked ? '#FC4C02' : '#64748B',
            fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.15s'
          }}
        >
          🔥 {isLiked ? 'Hyped!' : 'Hype this'}
        </button>
        <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
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
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        {(['week', 'today', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              border: `1.5px solid ${filter === f ? '#FC4C02' : '#E2E8F0'}`,
              background: filter === f ? '#FC4C02' : '#FFFFFF',
              color: filter === f ? '#FFFFFF' : '#64748B',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            {f === 'week' ? 'This Week' : f === 'today' ? 'Today' : 'All Time'}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
          {filteredRuns.length} run{filteredRuns.length !== 1 ? 's' : ''} logged
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748B', fontFamily: 'monospace' }}>
          Loading community runs...
        </div>
      ) : filteredRuns.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px', background: '#F8FAFC', borderRadius: '16px',
          border: '1.5px dashed #CBD5E1', color: '#64748B'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏃</div>
          <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>No runs logged {filter === 'today' ? 'today' : filter === 'week' ? 'this week' : 'yet'}</div>
          <div>Connect Strava and go for a relaxed run — it will appear here automatically!</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '16px' }}>
          {filteredRuns.map((run, i) => (
            <RunCard key={run.id} run={run} index={i} onLike={handleLike} likedIds={likedIds} />
          ))}
        </div>
      )}
    </div>
  )
}
