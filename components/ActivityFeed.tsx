"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

interface Comment {
  id: string
  text: string
  createdAt: string
  userName: string
  userInitials: string
  userId?: string
}

interface Run {
  id: string
  distanceKm: number
  durationSec: number
  paceSecPerKm: number
  avgHeartRate: number | null
  date: string
  notes: string | null
  source: string
  strava_activity_id?: string | null
  likesCount?: number
  comments?: Comment[]
  user: {
    id: string
    name: string
    initials: string
  }
}

interface MostImprovedRunner {
  userId: string
  name: string
  initials: string
  curKm: number
  prevKm: number
  diff: number
  pct: number
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

function RunCard({
  run,
  index,
  onLike,
  isLiked
}: {
  run: Run
  index: number
  onLike: (id: string) => void
  isLiked: boolean
}) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length]
  const [likes, setLikes] = useState(run.likesCount || 0)
  const [comments, setComments] = useState<Comment[]>(run.comments || [])
  const [newComment, setNewComment] = useState('')
  const [showCommentBox, setShowCommentBox] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)

  const isStravaRun = run.source === 'strava'

  const handleLikeClick = () => {
    onLike(run.id)
    setLikes(l => (isLiked ? Math.max(0, l - 1) : l + 1))
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submittingComment) return

    setSubmittingComment(true)
    try {
      let activeUser: any = null
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('runclub_active_user')
        if (saved) activeUser = JSON.parse(saved)
      }

      const res = await fetch('/api/feed/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: run.id,
          text: newComment,
          authorName: activeUser?.name || 'Teammate',
          authorUserId: activeUser?.id
        })
      })

      const data = await res.json()
      if (res.ok && data.comment) {
        setComments(prev => [...prev, data.comment])
        setNewComment('')
      }
    } catch (err) {
      console.error('Failed to post comment:', err)
    } finally {
      setSubmittingComment(false)
    }
  }

  return (
    <div
      style={{
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
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'monospace',
              fontSize: '13px',
              fontWeight: 800,
              color: '#FFFFFF',
              flexShrink: 0,
              cursor: 'pointer',
              boxShadow: `0 2px 8px ${color}40`,
            }}
          >
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
              <span
                style={{
                  background: 'rgba(252,76,2,0.1)',
                  color: '#FC4C02',
                  borderRadius: '6px',
                  padding: '1px 7px',
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                }}
              >
                STRAVA
              </span>
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
          <div
            key={stat.label}
            style={{
              background: '#F8FAFC',
              borderRadius: '10px',
              padding: '10px',
              textAlign: 'center',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '9px', color: '#64748B', letterSpacing: '0.5px', marginTop: '2px', fontWeight: 600 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {run.notes && (
        <div style={{ fontSize: '13px', color: '#475569', fontStyle: 'italic', borderLeft: '3px solid #CBD5E1', paddingLeft: '10px' }}>
          &ldquo;{run.notes}&rdquo;
        </div>
      )}

      {/* Like & Comments Action Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleLikeClick}
            style={{
              background: isLiked ? '#FFF7ED' : '#F8FAFC',
              border: `1.5px solid ${isLiked ? '#FC4C02' : '#E2E8F0'}`,
              borderRadius: '20px',
              padding: '6px 14px',
              color: isLiked ? '#FC4C02' : '#64748B',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s',
            }}
          >
            🔥 {isLiked ? 'Hyped' : 'Hype'} {likes > 0 ? `(${likes})` : ''}
          </button>

          <button
            onClick={() => setShowCommentBox(prev => !prev)}
            style={{
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: '20px',
              padding: '6px 14px',
              color: '#64748B',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            💬 {comments.length > 0 ? `${comments.length}` : 'Comment'}
          </button>
        </div>

        {run.strava_activity_id && (
          <a
            href={`https://www.strava.com/activities/${run.strava_activity_id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#FC4C02',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            View on Strava ↗
          </a>
        )}
      </div>

      {/* Comments List & Input Box */}
      {(showCommentBox || comments.length > 0) && (
        <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '12px', marginTop: '4px' }}>
          {comments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                  <span style={{ fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>
                    {c.userName}:
                  </span>
                  <span style={{ color: '#475569', wordBreak: 'break-word' }}>{c.text}</span>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="Drop some hype or encouragement..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '12px',
                outline: 'none',
                background: '#FFFFFF',
              }}
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              style={{
                background: '#FC4C02',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: newComment.trim() ? 'pointer' : 'default',
                opacity: newComment.trim() ? 1 : 0.6,
              }}
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default function ActivityFeed() {
  const [runs, setRuns] = useState<Run[]>([])
  const [mostImproved, setMostImproved] = useState<MostImprovedRunner[]>([])
  const [loading, setLoading] = useState(true)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'today' | 'week' | 'all'>('week')

  useEffect(() => {
    setLoading(true)
    fetch('/api/feed')
      .then(r => r.json())
      .then(data => {
        setRuns(data.runs || [])
        setMostImproved(data.mostImproved || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 7)

  const filteredRuns = runs.filter(r => {
    const d = new Date(r.date)
    if (filter === 'today') return d >= todayStart
    if (filter === 'week') return d >= weekStart
    return true
  })

  const handleLike = async (runId: string) => {
    setLikedIds(prev => {
      const next = new Set(prev)
      if (next.has(runId)) next.delete(runId)
      else next.add(runId)
      return next
    })

    try {
      let activeUser: any = null
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('runclub_active_user')
        if (saved) activeUser = JSON.parse(saved)
      }

      await fetch('/api/feed/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, userId: activeUser?.id })
      })
    } catch (e) {
      console.warn('Like sync failed:', e)
    }
  }

  return (
    <div>
      {/* ── MOST IMPROVED RUNNERS SPOTLIGHT ── */}
      {mostImproved.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%)',
            border: '1.5px solid #FDE68A',
            borderRadius: '20px',
            padding: '24px 28px',
            marginBottom: '36px',
            boxShadow: '0 4px 20px rgba(252,76,2,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>🏆</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#92400E' }}>
                  This Week&apos;s Most Improved Runners
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#B45309' }}>
                  Top runners stepping up their weekly volume compared to last week. Drop them some hype!
                </p>
              </div>
            </div>
            <span style={{
              background: '#F59E0B',
              color: '#FFFFFF',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.5px'
            }}>
              WEEKLY DELTA
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {mostImproved.map((runner, i) => (
              <div
                key={runner.userId}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '16px',
                  border: '1px solid #FDE68A',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: i === 0 ? '#FC4C02' : i === 1 ? '#0284C7' : '#16A34A',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '14px',
                    flexShrink: 0,
                  }}
                >
                  #{i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/dashboard/${runner.userId}`} style={{ textDecoration: 'none' }}>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {runner.name}
                    </div>
                  </Link>
                  <div style={{ fontSize: '12px', color: '#16A34A', fontWeight: 700, marginTop: '2px' }}>
                    +{runner.diff > 0 ? runner.diff : runner.curKm} km this week {runner.pct > 0 ? `(+${runner.pct}%)` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FC4C02', lineHeight: 1 }}>
                    {runner.curKm}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#64748B' }}>KM TOTAL</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              transition: 'all 0.15s',
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
        <div
          style={{
            textAlign: 'center',
            padding: '60px',
            background: '#F8FAFC',
            borderRadius: '16px',
            border: '1.5px dashed #CBD5E1',
            color: '#64748B',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏃</div>
          <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
            No runs logged {filter === 'today' ? 'today' : filter === 'week' ? 'this week' : 'yet'}
          </div>
          <div>Connect Strava and go for a relaxed run — it will appear here automatically!</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredRuns.map((run, i) => (
            <RunCard
              key={run.id}
              run={run}
              index={i}
              onLike={handleLike}
              isLiked={likedIds.has(run.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
