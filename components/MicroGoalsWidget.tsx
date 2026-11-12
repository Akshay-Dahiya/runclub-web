"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { generateMicroGoals, type MicroGoal } from '../lib/micro-goals'

interface MicroGoalsWidgetProps {
  runs?: any[]
  userId?: string
  selectedCategory?: string
}

type ChecklistItem = {
  itemKey: string
  checked: boolean
}

async function fetchChecklist(url: string): Promise<ChecklistItem[]> {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('Unable to load saved goals')
  return response.json()
}

export default function MicroGoalsWidget({ runs = [], userId, selectedCategory }: MicroGoalsWidgetProps) {
  const checklistKey = userId ? `/api/checklist?userId=${encodeURIComponent(userId)}` : null
  const { data, error: loadError, mutate } = useSWR<ChecklistItem[]>(checklistKey, fetchChecklist)
  const checklistItems = data ?? []
  const generatedGoals = useMemo(() => generateMicroGoals(runs, selectedCategory), [runs, selectedCategory])
  const customGoals = useMemo<MicroGoal[]>(
    () => checklistItems
      .filter((item) => item.itemKey.startsWith('custom:'))
      .map((item) => ({
        id: item.itemKey,
        title: item.itemKey.slice('custom:'.length),
        description: 'Your personal custom goal for this week.',
        category: 'fun',
        icon: '◇',
      })),
    [checklistItems],
  )
  const goals = [...customGoals, ...generatedGoals]
  const completedIds = useMemo(
    () => new Set(checklistItems.filter((item) => item.checked).map((item) => item.itemKey)),
    [checklistItems],
  )
  const [customGoalText, setCustomGoalText] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const isReadOnly = !userId

  async function saveChecklistItem(itemKey: string, checked: boolean) {
    if (!userId || !checklistKey || isSaving) return

    setIsSaving(true)
    setSaveError('')
    const previousItems = checklistItems
    const optimisticItems = [
      ...previousItems.filter((item) => item.itemKey !== itemKey),
      { itemKey, checked },
    ]
    await mutate(optimisticItems, { revalidate: false })

    try {
      const response = await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, itemKey, checked }),
      })
      if (!response.ok) throw new Error('Checklist update failed')
      const savedItem: ChecklistItem = await response.json()
      await mutate(
        [...optimisticItems.filter((item) => item.itemKey !== itemKey), savedItem],
        { revalidate: false },
      )
      if (checked) {
        setShowCelebration(true)
        window.setTimeout(() => setShowCelebration(false), 3000)
      }
    } catch {
      await mutate(previousItems, { revalidate: false })
      setSaveError('Your goal could not be saved. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  function toggleGoal(itemKey: string) {
    if (isReadOnly || isSaving) return
    void saveChecklistItem(itemKey, !completedIds.has(itemKey))
  }

  function addCustomGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = customGoalText.trim().slice(0, 90)
    if (!title || isReadOnly || isSaving) return
    void saveChecklistItem(`custom:${title}`, false)
    setCustomGoalText('')
    setShowCustomInput(false)
  }

  const completedCount = goals.filter((goal) => completedIds.has(goal.id)).length
  const progressPct = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0

  return (
    <section style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
      {showCelebration && (
        <p role="status" style={{ position: 'absolute', top: 0, left: 0, right: 0, background: '#16A34A', color: '#FFFFFF', padding: '10px 20px', textAlign: 'center', fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, zIndex: 10 }}>
          Goal completed. Nice work.
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ background: 'rgba(252,76,2,0.1)', color: '#FC4C02', fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', letterSpacing: '1px' }}>
              WEEKLY MICRO-GOALS
            </span>
            <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>Small wins add up</span>
          </div>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
            Bite-Sized Goals You Can Actually Hit
          </h3>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0' }}>
            Generated from your recent mileage. Consistent, gradual progress comes first.
          </p>
        </div>

        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 16px', textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: completedCount === goals.length && goals.length > 0 ? '#16A34A' : '#FC4C02' }}>
            {completedCount} / {goals.length}
          </div>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748B' }}>COMPLETED THIS WEEK</div>
        </div>
      </div>

      <div aria-hidden="true" style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #FC4C02, #F59E0B)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
      </div>

      {isReadOnly && (
        <p role="status" style={{ color: '#64748B', fontSize: '13px', margin: '0 0 16px' }}>
          Preview goals are read-only. <Link href="/login" style={{ color: '#FC4C02', fontWeight: 700 }}>Join with Strava</Link> to save your progress.
        </p>
      )}
      {loadError && <p role="alert" style={{ color: '#B91C1C', fontSize: '13px' }}>Saved goals could not be loaded.</p>}
      {saveError && <p role="alert" style={{ color: '#B91C1C', fontSize: '13px' }}>{saveError}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
        {goals.map((goal) => {
          const isDone = completedIds.has(goal.id)
          return (
            <button
              key={goal.id}
              type="button"
              aria-pressed={isDone}
              disabled={isReadOnly || isSaving}
              onClick={() => toggleGoal(goal.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '18px 20px', borderRadius: '16px', background: isDone ? '#F0FDF4' : '#F8FAFC', border: `1.5px solid ${isDone ? '#86EFAC' : '#E2E8F0'}`, cursor: isReadOnly || isSaving ? 'default' : 'pointer', textAlign: 'left', font: 'inherit', boxShadow: isDone ? 'none' : '0 2px 8px rgba(0,0,0,0.02)' }}
            >
              <span aria-hidden="true" style={{ width: '26px', height: '26px', borderRadius: '50%', border: `2px solid ${isDone ? '#16A34A' : '#CBD5E1'}`, background: isDone ? '#16A34A' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, flexShrink: 0, marginTop: '2px' }}>
                {isDone ? '✓' : ''}
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span aria-hidden="true" style={{ fontSize: '1.1rem' }}>{goal.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: '15px', color: isDone ? '#166534' : '#0F172A', textDecoration: isDone ? 'line-through' : 'none' }}>
                    {goal.title}
                  </span>
                </span>
                <span style={{ display: 'block', fontSize: '13px', color: isDone ? '#4B7A5C' : '#64748B', lineHeight: 1.5 }}>
                  {goal.description}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {!isReadOnly && !showCustomInput && (
        <button type="button" onClick={() => setShowCustomInput(true)} disabled={isSaving} style={{ background: 'transparent', border: '1.5px dashed #CBD5E1', borderRadius: '12px', padding: '12px', width: '100%', color: '#64748B', fontSize: '13px', fontWeight: 600, cursor: isSaving ? 'default' : 'pointer' }}>
          Add a custom goal
        </button>
      )}
      {!isReadOnly && showCustomInput && (
        <form onSubmit={addCustomGoal} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            aria-label="Custom weekly goal"
            placeholder="Add a personal goal for this week"
            maxLength={90}
            required
            value={customGoalText}
            onChange={(event) => setCustomGoalText(event.target.value)}
            style={{ flex: '1 1 240px', minWidth: 0, background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '12px 16px', fontSize: '14px', outline: 'none', color: '#0F172A' }}
          />
          <button type="submit" disabled={isSaving} style={{ background: '#FC4C02', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '12px 20px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
            Add Goal
          </button>
          <button type="button" onClick={() => setShowCustomInput(false)} style={{ background: 'transparent', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 16px', color: '#64748B', fontSize: '13px', cursor: 'pointer' }}>
            Cancel
          </button>
        </form>
      )}
    </section>
  )
}
