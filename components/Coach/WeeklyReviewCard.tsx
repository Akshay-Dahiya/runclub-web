"use client"

import React, { useState, useEffect } from 'react'
import { fmtPace } from '../../lib/race-predictor'

interface WeeklyReviewCardProps {
  userId: string
  weekNumber: number
}

export default function WeeklyReviewCard({ userId, weekNumber }: WeeklyReviewCardProps) {
  const [review, setReview] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  const fetchReview = (force = false) => {
    if (force) setRefreshing(true)
    else setLoading(true)

    fetch(`/api/coach/review?userId=${userId}&weekNumber=${weekNumber}`)
      .then(res => res.json())
      .then(data => {
        if (data.review) setReview(data.review)
      })
      .catch(err => console.error('Failed to load review:', err))
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }

  useEffect(() => {
    fetchReview()
  }, [userId, weekNumber])

  if (loading) {
    return (
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'monospace',
        color: 'var(--muted)',
        fontSize: '11px'
      }}>
        Loading Sunday Performance Review...
      </div>
    )
  }

  if (!review) return null

  const completionPct = review.kmPlanned > 0
    ? Math.min(100, Math.round((review.kmCompleted / review.kmPlanned) * 100))
    : 0

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--surface) 0%, rgba(34,211,238,0.04) 100%)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '28px',
      marginBottom: '32px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#22d3ee', letterSpacing: '2px', textTransform: 'uppercase' }}>
            // Module 4 · Sunday Performance Review
          </span>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', letterSpacing: '1px', margin: '4px 0 0 0' }}>
            Week {review.weekNumber} Performance Evaluation
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '12px', margin: '4px 0 0 0' }}>
            Weekly assessment comparing planned volume against logged execution.
          </p>
        </div>

        <button
          disabled={refreshing}
          onClick={() => fetchReview(true)}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--muted)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '10px',
            cursor: refreshing ? 'wait' : 'pointer'
          }}
        >
          {refreshing ? 'Updating...' : '↻ Re-evaluate'}
        </button>
      </div>

      {/* Progress Bar & Key Stats */}
      <div style={{
        background: 'var(--bg)',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid var(--border)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)' }}>
            Weekly Volume Completion
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: completionPct >= 80 ? '#4ade80' : 'var(--accent)' }}>
            {review.kmCompleted} km / {review.kmPlanned} km ({completionPct}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ height: '8px', background: 'var(--surface)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '16px' }}>
          <div style={{
            height: '100%',
            width: `${completionPct}%`,
            background: completionPct >= 90 ? 'linear-gradient(90deg, #4ade80, #22d3ee)' : 'linear-gradient(90deg, var(--accent), #facc15)',
            borderRadius: '4px',
            transition: 'width 1s ease'
          }} />
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', textAlign: 'center' }}>
          <div style={{ background: 'var(--surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: 'var(--text)' }}>
              {review.workoutsDone} / {review.workoutsPlanned}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '8px', color: 'var(--muted)' }}>WORKOUTS LOGGED</div>
          </div>

          <div style={{ background: 'var(--surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: 'var(--text)' }}>
              {review.avgPaceSec ? fmtPace(review.avgPaceSec) : '—'}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '8px', color: 'var(--muted)' }}>AVG TRAINING PACE</div>
          </div>

          <div style={{ background: 'var(--surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: 'var(--text)' }}>
              {review.avgHR ? `${review.avgHR} bpm` : '—'}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '8px', color: 'var(--muted)' }}>AVG HEART RATE</div>
          </div>
        </div>
      </div>

      {/* Coach's Evaluation */}
      <div style={{
        background: 'rgba(34,211,238,0.06)',
        borderLeft: '3px solid #22d3ee',
        borderRadius: '0 8px 8px 0',
        padding: '16px 20px',
        marginBottom: '16px'
      }}>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#22d3ee', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
          💬 Coach's Evaluation
        </div>
        <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text)', margin: 0 }}>
          {review.aiSummary}
        </p>
      </div>

      {/* Focus for next week */}
      <div style={{
        background: 'rgba(250,204,21,0.06)',
        borderLeft: '3px solid #facc15',
        borderRadius: '0 8px 8px 0',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{ fontSize: '1.2rem' }}>🎯</span>
        <div style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.5 }}>
          <strong>Next Week Focus:</strong> {review.nextWeekFocus}
        </div>
      </div>
    </div>
  )
}
