"use client"

import React, { useState } from 'react'
import { parseTimeInput, fmtTime, fmtPace } from '../../lib/race-predictor'

interface CoachOnboardingProps {
  userId: string
  existingProfile?: any
  onCompleted: (profile: any, plan: any) => void
  onCancel?: () => void
}

export default function CoachOnboarding({
  userId,
  existingProfile,
  onCompleted,
  onCancel
}: CoachOnboardingProps) {
  const [step, setStep] = useState<number>(1)
  const [submitting, setSubmitting] = useState(false)

  // Step 1: Running history
  const [pb5k, setPb5k] = useState(existingProfile?.pb5kSec ? fmtTime(existingProfile.pb5kSec) : '')
  const [pb10k, setPb10k] = useState(existingProfile?.pb10kSec ? fmtTime(existingProfile.pb10kSec) : '')
  const [pbHM, setPbHM] = useState(existingProfile?.pbHMSec ? fmtTime(existingProfile.pbHMSec) : '')
  const [pbMarathon, setPbMarathon] = useState(existingProfile?.pbMarathonSec ? fmtTime(existingProfile.pbMarathonSec) : '')
  const [hasRacedBefore, setHasRacedBefore] = useState(existingProfile?.hasRacedBefore ?? false)
  const [lastRaceDate, setLastRaceDate] = useState(existingProfile?.lastRaceDate ? existingProfile.lastRaceDate.split('T')[0] : '')
  const [weeklyKm, setWeeklyKm] = useState(existingProfile?.weeklyKmCurrent?.toString() || '15')
  const [yearsRunning, setYearsRunning] = useState(existingProfile?.yearsRunning?.toString() || '1')

  // Step 2: Availability
  const [daysPerWeek, setDaysPerWeek] = useState(existingProfile?.daysPerWeek || 4)
  const [strengthDays, setStrengthDays] = useState(existingProfile?.strengthDays || 1)
  const [hasGym, setHasGym] = useState(existingProfile?.hasGym ?? false)
  const [runEnvironment, setRunEnvironment] = useState<'both' | 'outdoor' | 'treadmill'>(
    existingProfile?.treadmillAccess && !existingProfile?.outdoorAccess ? 'treadmill' :
    !existingProfile?.treadmillAccess && existingProfile?.outdoorAccess ? 'outdoor' : 'both'
  )
  const [sessionMinutes, setSessionMinutes] = useState(existingProfile?.sessionMinutes || 60)

  // Step 3: Current fitness
  const [easyPace, setEasyPace] = useState(existingProfile?.easyPaceSec ? fmtPace(existingProfile.easyPaceSec).replace('/km', '') : '6:00')
  const [avgEasyKm, setAvgEasyKm] = useState(existingProfile?.avgEasyKm?.toString() || '5')
  const [longestLast30, setLongestLast30] = useState(existingProfile?.longestLast30?.toString() || '10')
  const [hasHRMonitor, setHasHRMonitor] = useState(existingProfile?.hasHRMonitor ?? true)
  const [restingHR, setRestingHR] = useState(existingProfile?.restingHR?.toString() || '60')

  // Step 4: Injury and recovery
  const [currentInjury, setCurrentInjury] = useState(existingProfile?.currentInjury || '')
  const [recurringInjury, setRecurringInjury] = useState(existingProfile?.recurringInjury || '')
  const [prefersWalkRun, setPrefersWalkRun] = useState(existingProfile?.prefersWalkRun ?? false)
  const [sleepHours, setSleepHours] = useState(existingProfile?.sleepHours?.toString() || '7.5')

  // Step 5: Next goal
  const [goalRace, setGoalRace] = useState(existingProfile?.goalRace || 'HM')
  const [goalRaceDate, setGoalRaceDate] = useState(existingProfile?.goalRaceDate ? existingProfile.goalRaceDate.split('T')[0] : '2027-02-07')
  const [goalTime, setGoalTime] = useState(existingProfile?.goalTimeSec ? fmtTime(existingProfile.goalTimeSec) : '')
  const [isFirstRace, setIsFirstRace] = useState(existingProfile?.isFirstRace ?? false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = {
        userId,
        // Step 1
        pb5kSec: parseTimeInput(pb5k),
        pb10kSec: parseTimeInput(pb10k),
        pbHMSec: parseTimeInput(pbHM),
        pbMarathonSec: parseTimeInput(pbMarathon),
        hasRacedBefore,
        lastRaceDate: lastRaceDate || null,
        weeklyKmCurrent: parseFloat(weeklyKm) || 15,
        yearsRunning: parseFloat(yearsRunning) || 1,

        // Step 2
        daysPerWeek: parseInt(daysPerWeek.toString(), 10),
        strengthDays: parseInt(strengthDays.toString(), 10),
        hasGym,
        outdoorAccess: runEnvironment === 'outdoor' || runEnvironment === 'both',
        treadmillAccess: runEnvironment === 'treadmill' || runEnvironment === 'both',
        sessionMinutes: parseInt(sessionMinutes.toString(), 10),

        // Step 3
        easyPaceSec: parseTimeInput(easyPace) || 360,
        avgEasyKm: parseFloat(avgEasyKm) || 5,
        longestLast30: parseFloat(longestLast30) || 10,
        hasHRMonitor,
        restingHR: restingHR ? parseInt(restingHR, 10) : null,

        // Step 4
        currentInjury: currentInjury.trim() || null,
        recurringInjury: recurringInjury.trim() || null,
        prefersWalkRun,
        sleepHours: parseFloat(sleepHours) || 7,

        // Step 5
        goalRace,
        goalRaceDate: goalRaceDate || null,
        goalTimeSec: parseTimeInput(goalTime) || null,
        isFirstRace,
      }

      const res = await fetch('/api/coach/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to submit onboarding profile')
      }

      const data = await res.json()
      onCompleted(data.profile, data.plan)
    } catch (err: any) {
      alert(err.message || 'Error saving coach onboarding')
    } finally {
      setSubmitting(false)
    }
  }

  const stepsList = [
    { num: 1, label: 'Running History', emoji: '👟' },
    { num: 2, label: 'Availability', emoji: '📅' },
    { num: 3, label: 'Current Fitness', emoji: '❤️' },
    { num: 4, label: 'Injury & Recovery', emoji: '🛡️' },
    { num: 5, label: 'Your Goal', emoji: '🎯' },
  ]

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '36px',
      maxWidth: '800px',
      margin: '0 auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--accent)', letterSpacing: '2px', textTransform: 'uppercase' }}>
            // RunClub AI Coach Onboarding
          </span>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '1px', margin: '4px 0 0 0' }}>
            Meet Your Personal Running Coach
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '6px 0 0 0', lineHeight: 1.5 }}>
            To build a safe, personalized training plan, we start by understanding your background, schedule, and goals.
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '18px', cursor: 'pointer' }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Step Stepper */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '8px',
        marginBottom: '32px',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '20px'
      }}>
        {stepsList.map(s => {
          const isActive = s.num === step
          const isDone = s.num < step
          return (
            <div
              key={s.num}
              onClick={() => isDone && setStep(s.num)}
              style={{
                textAlign: 'center',
                cursor: isDone ? 'pointer' : 'default',
                opacity: isActive || isDone ? 1 : 0.4,
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                margin: '0 auto 6px',
                background: isDone ? '#4ade80' : isActive ? 'var(--accent)' : 'var(--bg)',
                color: isDone || isActive ? '#000' : 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '13px',
                fontFamily: 'monospace',
                border: isDone || isActive ? 'none' : '1px solid var(--border)'
              }}>
                {isDone ? '✓' : s.num}
              </div>
              <div style={{ fontSize: '10px', fontFamily: 'monospace', color: isActive ? 'var(--text)' : 'var(--muted)', fontWeight: isActive ? 700 : 400 }}>
                {s.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── STEP 1: Running history ─── */}
      {step === 1 && (
        <div style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👟</span> Step 1: Your Running History
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '24px' }}>
            Enter your personal bests (PBs). If you haven't attempted a distance yet, feel free to leave it blank.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                5K BEST (MM:SS)
              </label>
              <input
                type="text"
                placeholder="e.g. 26:30"
                value={pb5k}
                onChange={e => setPb5k(e.target.value)}
                className="coach-input"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                10K BEST (MM:SS)
              </label>
              <input
                type="text"
                placeholder="e.g. 56:15"
                value={pb10k}
                onChange={e => setPb10k(e.target.value)}
                className="coach-input"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                HALF MARATHON (H:MM:SS)
              </label>
              <input
                type="text"
                placeholder="e.g. 2:05:00"
                value={pbHM}
                onChange={e => setPbHM(e.target.value)}
                className="coach-input"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                FULL MARATHON (H:MM:SS)
              </label>
              <input
                type="text"
                placeholder="e.g. 4:30:00 (or blank)"
                value={pbMarathon}
                onChange={e => setPbMarathon(e.target.value)}
                className="coach-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                CURRENT WEEKLY MILEAGE (KM / WEEK)
              </label>
              <input
                type="number"
                placeholder="e.g. 15"
                value={weeklyKm}
                onChange={e => setWeeklyKm(e.target.value)}
                className="coach-input"
              />
              <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                How many km are you currently running each week?
              </span>
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                YEARS OF RUNNING EXPERIENCE
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 1.5"
                value={yearsRunning}
                onChange={e => setYearsRunning(e.target.value)}
                className="coach-input"
              />
              <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                How long have you been running consistently?
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={hasRacedBefore}
                onChange={e => setHasRacedBefore(e.target.checked)}
              />
              <span>I have participated in an official race or timed event before</span>
            </label>
            {hasRacedBefore && (
              <div style={{ marginTop: '12px', maxWidth: '300px' }}>
                <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '10px', color: 'var(--muted)', marginBottom: '4px' }}>
                  WHEN WAS YOUR LAST RACE?
                </label>
                <input
                  type="date"
                  value={lastRaceDate}
                  onChange={e => setLastRaceDate(e.target.value)}
                  className="coach-input"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── STEP 2: Availability ─── */}
      {step === 2 && (
        <div style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📅</span> Step 2: Availability & Schedule
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '24px' }}>
            Tell us how many days and hours you can realistically commit each week without risking burnout.
          </p>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '10px' }}>
              HOW MANY DAYS PER WEEK CAN YOU RUN? ({daysPerWeek} DAYS)
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[2, 3, 4, 5, 6, 7].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDaysPerWeek(d)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${daysPerWeek === d ? 'var(--accent)' : 'var(--border)'}`,
                    background: daysPerWeek === d ? 'rgba(252,76,2,0.15)' : 'var(--bg)',
                    color: daysPerWeek === d ? 'var(--accent)' : 'var(--text)',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {d}d
                </button>
              ))}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '6px', display: 'block' }}>
              Most runners thrive on 3 to 4 running days per week with adequate recovery.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                STRENGTH TRAINING DAYS PER WEEK
              </label>
              <select
                value={strengthDays}
                onChange={e => setStrengthDays(parseInt(e.target.value, 10))}
                className="coach-input"
              >
                <option value={0}>0 days (Running only)</option>
                <option value={1}>1 day (Light bodyweight/core)</option>
                <option value={2}>2 days (Recommended for injury prevention)</option>
                <option value={3}>3+ days</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                MAX TIME PER SESSION
              </label>
              <select
                value={sessionMinutes}
                onChange={e => setSessionMinutes(parseInt(e.target.value, 10))}
                className="coach-input"
              >
                <option value={40}>30–40 minutes</option>
                <option value={60}>45–60 minutes (Standard)</option>
                <option value={75}>60–75 minutes</option>
                <option value={90}>90+ minutes (Weekend long runs)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                WHERE DO YOU RUN?
              </label>
              <select
                value={runEnvironment}
                onChange={e => setRunEnvironment(e.target.value as any)}
                className="coach-input"
              >
                <option value="both">Both Outdoors &amp; Treadmill</option>
                <option value="outdoor">Outdoors (Road / Trail) only</option>
                <option value="treadmill">Treadmill only</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '12px' }}>
                ACCESS TO GYM EQUIPMENT?
              </label>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', paddingTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="radio" checked={hasGym} onChange={() => setHasGym(true)} />
                  <span>Yes (Weights/Gym)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="radio" checked={!hasGym} onChange={() => setHasGym(false)} />
                  <span>No (Bodyweight only)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Current fitness ─── */}
      {step === 3 && (
        <div style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>❤️</span> Step 3: Current Aerobic Fitness
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '24px' }}>
            This helps our engine calculate your baseline easy pace and heart rate training zones.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                COMFORTABLE CONVERSATIONAL PACE (MM:SS/KM)
              </label>
              <input
                type="text"
                placeholder="e.g. 6:00"
                value={easyPace}
                onChange={e => setEasyPace(e.target.value)}
                className="coach-input"
              />
              <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                The pace where you can speak in full sentences without gasping for breath.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                AVERAGE EASY RUN DISTANCE (KM)
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 5.0"
                value={avgEasyKm}
                onChange={e => setAvgEasyKm(e.target.value)}
                className="coach-input"
              />
              <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                Your typical weekday maintenance run distance.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                LONGEST RUN IN LAST 30 DAYS (KM)
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 10.0"
                value={longestLast30}
                onChange={e => setLongestLast30(e.target.value)}
                className="coach-input"
              />
              <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                Longest distance run continuously in the last month.
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={hasHRMonitor}
                  onChange={e => setHasHRMonitor(e.target.checked)}
                />
                <span>I use a smartwatch or chest strap for heart rate</span>
              </label>
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                RESTING HEART RATE (BPM)
              </label>
              <input
                type="number"
                placeholder="e.g. 58 (leave blank if unknown)"
                value={restingHR}
                onChange={e => setRestingHR(e.target.value)}
                className="coach-input"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 4: Injury and recovery ─── */}
      {step === 4 && (
        <div style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🛡️</span> Step 4: Injury Prevention &amp; Recovery
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '24px' }}>
            Your safety is our #1 constraint. Training plans adapt to protect your tendons and joints.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                CURRENT PAIN OR INJURIES?
              </label>
              <input
                type="text"
                placeholder="e.g. slight right knee pain, or 'None'"
                value={currentInjury}
                onChange={e => setCurrentInjury(e.target.value)}
                className="coach-input"
              />
              <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                If you have an active twinge, we will program extra recovery.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                PAST RECURRING INJURIES
              </label>
              <input
                type="text"
                placeholder="e.g. shin splints, plantar fasciitis, none"
                value={recurringInjury}
                onChange={e => setRecurringInjury(e.target.value)}
                className="coach-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                AVERAGE SLEEP PER NIGHT (HOURS)
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 7.5"
                value={sleepHours}
                onChange={e => setSleepHours(e.target.value)}
                className="coach-input"
              />
              <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                Adaptation happens in sleep, not during the run.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={prefersWalkRun}
                  onChange={e => setPrefersWalkRun(e.target.checked)}
                />
                <span>I prefer the Run/Walk method (Galloway method)</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 5: Next goal ─── */}
      {step === 5 && (
        <div style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎯</span> Step 5: Establish Your Target Race Goal
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '24px' }}>
            What event are you working towards, and what finish time are you dreaming of?
          </p>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '10px' }}>
              TARGET RACE DISTANCE
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {[
                { id: '5K', label: '5K', dist: '5 km' },
                { id: '10K', label: '10K', dist: '10.5 km' },
                { id: 'HM', label: 'Half Marathon', dist: '21.1 km' },
                { id: 'Marathon', label: 'Marathon', dist: '42.2 km' },
              ].map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setGoalRace(r.id)}
                  style={{
                    padding: '16px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${goalRace === r.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: goalRace === r.id ? 'rgba(252,76,2,0.15)' : 'var(--bg)',
                    color: goalRace === r.id ? 'var(--accent)' : 'var(--text)',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem' }}>{r.label}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--muted)' }}>{r.dist}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                TARGET FINISH TIME (e.g. 55:00 or 2:00:00)
              </label>
              <input
                type="text"
                placeholder={goalRace === 'HM' || goalRace === 'Marathon' ? 'e.g. 2:05:00' : 'e.g. 55:00'}
                value={goalTime}
                onChange={e => setGoalTime(e.target.value)}
                className="coach-input"
              />
              <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                We will validate if this is Conservative, Realistic, or Ambitious.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                RACE DATE (OPTIONAL)
              </label>
              <input
                type="date"
                value={goalRaceDate}
                onChange={e => setGoalRaceDate(e.target.value)}
                className="coach-input"
              />
              <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                Indian Navy Half Marathon (Delhi) is on Feb 7, 2027.
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={isFirstRace}
                onChange={e => setIsFirstRace(e.target.checked)}
              />
              <span>This will be my first official race at this distance</span>
            </label>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid var(--border)',
        paddingTop: '24px',
        marginTop: '24px'
      }}>
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(s => s - 1)}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}
          >
            ← Back
          </button>
        ) : <div />}

        {step < 5 ? (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            style={{
              background: 'var(--accent)',
              color: '#000',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '13px',
              fontWeight: 700
            }}
          >
            Continue →
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            style={{
              background: 'var(--accent)',
              color: '#000',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '6px',
              cursor: submitting ? 'wait' : 'pointer',
              fontFamily: 'monospace',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: '0 4px 20px rgba(252,76,2,0.4)'
            }}
          >
            {submitting ? 'Generating Your Plan...' : 'Generate AI Coach Plan 🚀'}
          </button>
        )}
      </div>

      <style jsx>{`
        .coach-input {
          width: 100%;
          box-sizing: border-box;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px 14px;
          font-family: monospace;
          font-size: 14px;
          color: var(--text);
          outline: none;
          transition: border-color 0.2s;
        }
        .coach-input:focus {
          border-color: var(--accent);
        }
      `}</style>
    </div>
  )
}
