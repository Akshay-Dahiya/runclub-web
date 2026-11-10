"use client"

import React, { useState, useEffect } from 'react'
import { MicroGoal, generateMicroGoals } from '../lib/micro-goals'

interface MicroGoalsWidgetProps {
  runs?: any[]
  userId?: string
  selectedCategory?: string
}

export default function MicroGoalsWidget({ runs = [], userId, selectedCategory }: MicroGoalsWidgetProps) {
  const [goals, setGoals] = useState<MicroGoal[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [customGoalText, setCustomGoalText] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  // Initialize generated goals
  useEffect(() => {
    const generated = generateMicroGoals(runs, selectedCategory)
    // Check local storage for completed states
    const storageKey = `runclub_microgoals_${userId || 'guest'}`
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setCompletedIds(new Set(parsed))
      } catch (e) {}
    }
    setGoals(generated)
  }, [runs, userId, selectedCategory])

  const triggerConfetti = () => {
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 3000)
  }

  const toggleGoal = (id: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev)
      const isCompleting = !next.has(id)
      if (isCompleting) {
        next.add(id)
        triggerConfetti()
      } else {
        next.delete(id)
      }
      const storageKey = `runclub_microgoals_${userId || 'guest'}`
      localStorage.setItem(storageKey, JSON.stringify(Array.from(next)))

      // If user is authenticated, sync to backend checklist item
      if (userId) {
        fetch('/api/checklist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, itemKey: id, checked: isCompleting })
        }).catch(() => {})
      }
      return next
    })
  }

  const addCustomGoal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customGoalText.trim()) return
    const newGoal: MicroGoal = {
      id: `custom-${Date.now()}`,
      title: customGoalText.trim(),
      description: 'Your personal custom goal for this week.',
      category: 'fun',
      icon: '🎯'
    }
    setGoals(prev => [newGoal, ...prev])
    setCustomGoalText('')
    setShowCustomInput(false)
  }

  const completedCount = goals.filter(g => completedIds.has(g.id)).length
  const progressPct = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '20px',
      padding: '32px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Celebration Banner */}
      {showCelebration && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(90deg, #16A34A, #22C55E)',
          color: '#FFFFFF',
          padding: '10px 20px',
          textAlign: 'center',
          fontFamily: 'monospace',
          fontSize: '12px',
          fontWeight: 700,
          zIndex: 10,
          animation: 'fadeSlideUp 0.3s ease both'
        }}>
          🎉 Awesome job! One step closer to becoming a stronger, happier runner!
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              background: 'rgba(252,76,2,0.1)',
              color: '#FC4C02',
              fontSize: '10px',
              fontFamily: 'monospace',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '20px',
              letterSpacing: '1px'
            }}>
              WEEKLY MICRO-GOALS
            </span>
            <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
              Small wins add up
            </span>
          </div>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
            Bite-Sized Goals You Can Actually Hit
          </h3>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0' }}>
            Generated based on your recent mileage. Remember: to run fast, you must run slow.
          </p>
        </div>

        {/* Progress Pill */}
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '10px 16px',
          textAlign: 'right'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: completedCount === goals.length && goals.length > 0 ? '#16A34A' : '#FC4C02' }}>
            {completedCount} / {goals.length}
          </div>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748B' }}>
            COMPLETED THIS WEEK
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{
          height: '100%',
          width: `${progressPct}%`,
          background: 'linear-gradient(90deg, #FC4C02, #F59E0B)',
          borderRadius: '3px',
          transition: 'width 0.5s ease'
        }} />
      </div>

      {/* Goals List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
        {goals.map(goal => {
          const isDone = completedIds.has(goal.id)
          return (
            <div
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '18px 20px',
                borderRadius: '16px',
                background: isDone ? '#F0FDF4' : '#F8FAFC',
                border: `1.5px solid ${isDone ? '#86EFAC' : '#E2E8F0'}`,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isDone ? 'none' : '0 2px 8px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={e => {
                if (!isDone) (e.currentTarget.style.borderColor = '#CBD5E1')
              }}
              onMouseLeave={e => {
                if (!isDone) (e.currentTarget.style.borderColor = '#E2E8F0')
              }}
            >
              {/* Checkbox circle */}
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                border: `2px solid ${isDone ? '#16A34A' : '#CBD5E1'}`,
                background: isDone ? '#16A34A' : '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                flexShrink: 0,
                marginTop: '2px',
                transition: 'all 0.2s'
              }}>
                {isDone ? '✓' : ''}
              </div>

              {/* Goal Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1.1rem' }}>{goal.icon}</span>
                  <span style={{
                    fontWeight: 700,
                    fontSize: '15px',
                    color: isDone ? '#166534' : '#0F172A',
                    textDecoration: isDone ? 'line-through' : 'none'
                  }}>
                    {goal.title}
                  </span>
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '13px',
                  color: isDone ? '#4B7A5C' : '#64748B',
                  lineHeight: 1.5
                }}>
                  {goal.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Custom Goal Button / Input */}
      {!showCustomInput ? (
        <button
          onClick={() => setShowCustomInput(true)}
          style={{
            background: 'transparent',
            border: '1.5px dashed #CBD5E1',
            borderRadius: '12px',
            padding: '12px',
            width: '100%',
            color: '#64748B',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#FC4C02'
            e.currentTarget.style.color = '#FC4C02'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#CBD5E1'
            e.currentTarget.style.color = '#64748B'
          }}
        >
          + Add Your Own Custom Goal
        </button>
      ) : (
        <form onSubmit={addCustomGoal} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="e.g. Run with a friend on Saturday, or 5K without stopping"
            value={customGoalText}
            onChange={e => setCustomGoalText(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              background: '#F8FAFC',
              border: '1.5px solid #CBD5E1',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '14px',
              outline: 'none',
              color: '#0F172A'
            }}
          />
          <button
            type="submit"
            style={{
              background: '#FC4C02',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Add Goal
          </button>
          <button
            type="button"
            onClick={() => setShowCustomInput(false)}
            style={{
              background: 'transparent',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#64748B',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  )
}
