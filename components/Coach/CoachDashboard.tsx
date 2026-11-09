"use client"

import React, { useState, useEffect, useMemo } from 'react'
import CoachOnboarding from './CoachOnboarding'
import RacePredictorCard from './RacePredictorCard'
import GoalSetterCard from './GoalSetterCard'
import TrainingPlanView from './TrainingPlanView'
import WeeklyReviewCard from './WeeklyReviewCard'
import { generatePredictions } from '../../lib/race-predictor'
import { analyseGoal, GoalTier } from '../../lib/goal-setter'

interface CoachDashboardProps {
  userId: string
  userName: string
  runs: any[]
}

type TabType = 'plan' | 'predictions' | 'goal' | 'review'

export default function CoachDashboard({ userId, userName, runs }: CoachDashboardProps) {
  const [profile, setProfile] = useState<any>(null)
  const [activePlan, setActivePlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('plan')
  const [isUpdatingTier, setIsUpdatingTier] = useState(false)

  const loadCoachData = () => {
    setLoading(true)
    fetch(`/api/coach/onboarding?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.profile) {
          setProfile(data.profile)
          if (!data.profile.onboardingDone) {
            setShowOnboarding(true)
          }
        } else {
          setShowOnboarding(true)
        }
        if (data.activePlan) {
          setActivePlan(data.activePlan)
        }
      })
      .catch(err => console.error('Failed to load coach data:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCoachData()
  }, [userId])

  // Deterministic calculations
  const predictionSet = useMemo(() => {
    const prs = {
      pb5kSec: profile?.pb5kSec,
      pb10kSec: profile?.pb10kSec,
      pbHMSec: profile?.pbHMSec,
      pbMarathonSec: profile?.pbMarathonSec,
    }
    const runSamples = (runs || []).map(r => ({
      distanceKm: r.distanceKm,
      durationSec: r.durationSec,
      date: r.date,
    }))
    return generatePredictions(prs, runSamples, profile?.yearsRunning || 1)
  }, [profile, runs])

  const goalAnalysis = useMemo(() => {
    if (!profile) return null
    const race = profile.goalRace || '10K'
    const currentPred = predictionSet.predictions[race]
    const predictedSec = currentPred ? currentPred.predictedSec : 3600
    const goalSec = profile.goalTimeSec || predictedSec

    return analyseGoal(
      race,
      predictedSec,
      goalSec,
      profile.goalRaceDate ? new Date(profile.goalRaceDate) : null,
      profile.weeklyKmCurrent || 20
    )
  }, [profile, predictionSet])

  const handleSelectTier = async (tier: GoalTier) => {
    setIsUpdatingTier(true)
    try {
      const res = await fetch('/api/coach/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          goalRace: profile.goalRace || '10K',
          goalTimeSec: tier.timeSec,
          goalRaceDate: profile.goalRaceDate,
          daysPerWeek: profile.daysPerWeek || 4,
        }),
      })
      if (!res.ok) throw new Error('Failed to update plan')
      const data = await res.json()
      setActivePlan(data.plan)
      setProfile((prev: any) => ({ ...prev, goalTimeSec: tier.timeSec }))
      setActiveTab('plan')
    } catch (err: any) {
      alert(err.message || 'Error updating goal tier')
    } finally {
      setIsUpdatingTier(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)', fontFamily: 'monospace' }}>
        Loading RunClub AI Coach...
      </div>
    )
  }

  // If user needs onboarding
  if (showOnboarding || !profile?.onboardingDone) {
    return (
      <CoachOnboarding
        userId={userId}
        existingProfile={profile}
        onCompleted={(newProfile, newPlan) => {
          setProfile(newProfile)
          if (newPlan) setActivePlan(newPlan)
          setShowOnboarding(false)
        }}
        onCancel={profile?.onboardingDone ? () => setShowOnboarding(false) : undefined}
      />
    )
  }

  return (
    <div>
      {/* Top Banner & Control Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '20px'
      }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--accent)', letterSpacing: '2px', textTransform: 'uppercase' }}>
            // RunClub AI Coach &amp; Training Engine
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', letterSpacing: '1px', margin: '4px 0 0 0' }}>
            {userName}&apos;s Coach Dashboard
          </h2>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
            Target: <strong>{profile?.goalRace || '10K'}</strong> · {profile?.daysPerWeek || 4} Training Days/Week · Current Volume: {profile?.weeklyKmCurrent || 15} km/wk
          </div>
        </div>

        <button
          onClick={() => setShowOnboarding(true)}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            borderRadius: '6px',
            padding: '8px 16px',
            fontFamily: 'monospace',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          ⚙️ Edit Profile &amp; Preferences
        </button>
      </div>

      {/* Feature Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {[
          { id: 'plan', label: '📅 Training Schedule', count: activePlan ? `${activePlan.weeksTotal} Wks` : null },
          { id: 'predictions', label: '🏁 Race Predictor' },
          { id: 'goal', label: '🎯 Goal Setter' },
          { id: 'review', label: '📊 Sunday Review' },
        ].map(tab => {
          const isSelected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                background: isSelected ? 'var(--accent)' : 'var(--surface)',
                color: isSelected ? '#000' : 'var(--text)',
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{tab.label}</span>
              {tab.count && (
                <span style={{
                  background: isSelected ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '10px'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab 1: Training Schedule */}
      {activeTab === 'plan' && (
        <TrainingPlanView
          plan={activePlan}
          onWorkoutUpdated={loadCoachData}
        />
      )}

      {/* Tab 2: Race Predictor */}
      {activeTab === 'predictions' && (
        <RacePredictorCard predictionSet={predictionSet} />
      )}

      {/* Tab 3: Goal Setter */}
      {activeTab === 'goal' && goalAnalysis && (
        <GoalSetterCard
          analysis={goalAnalysis}
          onSelectTier={handleSelectTier}
          isSubmitting={isUpdatingTier}
        />
      )}

      {/* Tab 4: Sunday Performance Review */}
      {activeTab === 'review' && (
        <WeeklyReviewCard
          userId={userId}
          weekNumber={activePlan?.currentWeek || 1}
        />
      )}
    </div>
  )
}
