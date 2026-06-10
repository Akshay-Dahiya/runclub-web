"use client"

import React, { useState, useEffect, useCallback } from 'react'
import AICoachWidget from '../AICoach/AICoachWidget'
type Provider = 'strava'

const providerMeta: Record<Provider, { name: string; color: string; blurb: string }> = {
  strava: {
    name: 'Strava',
    color: '#FC4C02',
    blurb: 'Work in progress to link with Strava. Will automatically sync your runs soon.',
  }
}

const metrics = [
  {
    icon: '❤️', title: 'Resting Heart Rate',
    what: "Beats per minute when you're fully at rest, typically measured overnight.",
    why: 'A lower RHR usually means a stronger heart and better aerobic fitness. A sudden spike can signal fatigue, illness, or under-recovery.',
    good: 'Trained runners: 40–55 bpm',
  },
  {
    icon: '⚡', title: 'VO2 Max',
    what: 'The max volume of oxygen your body can use per kg of bodyweight per minute.',
    why: 'The single best predictor of endurance performance. Goes up with consistent training, especially intervals at 90–95% max HR.',
    good: 'Avg male 35–40 · Avg female 27–35 · Elite 60+',
  },
  {
    icon: '🎯', title: 'Cadence (SPM)',
    what: 'Steps per minute while running — count both feet.',
    why: 'Higher cadence (shorter, quicker strides) reduces ground contact time and overstriding, lowering injury risk at the knees and hips.',
    good: 'Target ~170–180 spm at easy pace',
  },
  {
    icon: '📈', title: 'Training Load',
    what: 'A weighted score combining intensity (HR/pace) and duration of each session over 7 days.',
    why: "Tells you if you're under-training (no progress), productive (gains), or overreaching (injury/burnout risk).",
    good: "Stay in 'Productive' or 'Maintaining' bands",
  },
  {
    icon: '🌙', title: 'HRV (Heart Rate Variability)',
    what: 'The variation in time between each heartbeat, measured overnight in ms.',
    why: 'Higher HRV = nervous system is recovered and ready to absorb training. Low HRV = back off, sleep, hydrate.',
    good: 'Watch the trend, not the number — your baseline is personal',
  },
  {
    icon: '🔥', title: 'Calories & Active kcal',
    what: 'Estimated energy burned. Active kcal excludes your basal metabolic rate.',
    why: 'Useful for fueling — long runs (>90 min) need ~30–60g carbs per hour to avoid bonking on race day.',
    good: 'Easy run: ~60 kcal/km · Hard: ~80 kcal/km',
  },
  {
    icon: '👣', title: 'Ground Contact Time',
    what: 'Milliseconds your foot is on the ground per stride.',
    why: 'Elite runners are typically <200ms. Shorter GCT = more efficient running economy and less braking force.',
    good: 'Recreational 250–300ms · Elite 160–200ms',
  },
  {
    icon: '⛰️', title: 'Elevation Gain',
    what: 'Total vertical metres climbed across a run.',
    why: 'Hills build power, recruit more muscle fibres, and toughen tendons. 100m of climb roughly equals an extra km of effort.',
    good: 'Add 1 hilly session per week',
  },
  {
    icon: '⏱️', title: 'Lactate Threshold Pace',
    what: 'The fastest pace you can hold while clearing lactate as fast as you produce it — roughly 1-hour race pace.',
    why: 'The biggest lever for marathon/half times. Tempo runs at this pace shift the wall further out.',
    good: "Train it weekly: 20–40 min at 'comfortably hard'",
  },
  {
    icon: '🔄', title: 'Recovery Time',
    what: 'Hours your watch recommends before another hard session, based on HR + load.',
    why: 'Adaptations happen during recovery, not during the run. Stack hard days too close and you regress.',
    good: 'Respect it — or earn an injury',
  },
]

const zones = [
  { name: 'Z1 Recovery', range: '50–60% maxHR', pct: 22, color: '#4ade80', desc: 'Walk/jog. Builds aerobic base, flushes legs. Should feel like nothing.' },
  { name: 'Z2 Endurance', range: '60–70%', pct: 48, color: '#22d3ee', desc: 'Conversational pace. The bread & butter — burns fat, builds capillaries.' },
  { name: 'Z3 Tempo', range: '70–80%', pct: 15, color: '#facc15', desc: 'Comfortably hard. Short phrases only. Builds lactate clearance.' },
  { name: 'Z4 Threshold', range: '80–90%', pct: 11, color: '#fb923c', desc: 'Race pace 10K–HM. One word at a time. The big fitness driver.' },
  { name: 'Z5 VO2 Max', range: '90–100%', pct: 4, color: '#ef4444', desc: 'All-out intervals, 30s–5min. Raises your ceiling. Use sparingly.' },
]

export default function DashboardClient({
  dbUser: initialDbUser,
  participantDef,
  actualKm,
  plannedKm,
  status,
  pct,
  totalTarget
}: any) {
  const uniqueRunsMap = new Map()
  if (initialDbUser?.runs) {
    initialDbUser.runs.forEach((r: any) => {
      const d = new Date(r.date).toISOString().split('T')[0]
      const key = `${d}-${r.distanceKm}-${r.paceSecPerKm}`
      if (!uniqueRunsMap.has(key)) uniqueRunsMap.set(key, r)
    })
  }
  const dbUser = { ...initialDbUser, runs: Array.from(uniqueRunsMap.values()) }

  const [connected, setConnected] = useState<Record<Provider, boolean>>({
    strava: false
  })
  const toggle = (p: Provider) => setConnected(c => ({ ...c, [p]: !c[p] }))

  const [distance, setDistance] = useState('')
  const [date, setDate] = useState('')
  useEffect(() => setDate(new Date().toISOString().split('T')[0]), [])
  const [pace, setPace] = useState('')
  const [duration, setDuration] = useState('')
  const [heartRate, setHeartRate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  // New state for plan modal
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>('')

  const handleLogRun = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const distKm = parseFloat(distance)
      if (isNaN(distKm) || distKm <= 0) {
        alert("Distance is mandatory and must be greater than 0.")
        setLoading(false)
        return
      }

      if (!pace && !duration) {
        alert("Please provide either Pace or Duration.")
        setLoading(false)
        return
      }

      let durationSec = 0
      let paceSecPerKm = 0

      const parsePaceToSec = (timeStr: string) => {
        const clean = timeStr.trim().replace(/\./g, ':')
        if (clean.includes(':')) {
          const parts = clean.split(':').map(Number)
          if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
          if (parts.length === 2) return parts[0] * 60 + parts[1] // MM:SS
        }
        return parseInt(clean, 10) * 60
      }

      const parseDurationToSec = (timeStr: string) => {
        const clean = timeStr.trim().replace(/\./g, ':')
        if (clean.includes(':')) {
          const parts = clean.split(':').map(Number)
          if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2] // HH:MM:SS
          if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60 // HH:MM
        }
        return parseInt(clean, 10) * 60 // plain number assumed minutes
      }

      if (pace && !duration) {
        paceSecPerKm = parsePaceToSec(pace)
        durationSec = Math.round(distKm * paceSecPerKm)
      } else if (duration && !pace) {
        durationSec = parseDurationToSec(duration)
        paceSecPerKm = Math.round(durationSec / distKm)
      } else {
        // Both provided
        durationSec = parseDurationToSec(duration)
        paceSecPerKm = parsePaceToSec(pace)
      }

      // Find userId from dbUser
      const userId = dbUser?.id
      if (!userId) { alert('User not found in database yet. Please try again later.'); setLoading(false); return }

      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, date, distanceKm: distKm, paceSecPerKm, durationSec, notes, avgHeartRate: heartRate ? parseInt(heartRate, 10) : null })
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || 'Failed to log run')
      }
      setSuccess(true)
      setDistance(''); setPace(''); setDuration(''); setNotes(''); setHeartRate('')
      setTimeout(() => { window.location.reload() }, 1200)
    } catch (err) {
      alert('Failed to log run. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRun = async (runId: string) => {
    if (!confirm('Delete this run?')) return
    await fetch(`/api/runs?id=${runId}`, { method: 'DELETE' })
    window.location.reload()
  }

  // Week stats
  const weekRuns = dbUser.runs.filter((r: any) => {
    const d = new Date(r.date)
    const now = new Date()
    const start = new Date(now); start.setDate(now.getDate() - now.getDay())
    return d >= start
  })
  const weekKm = weekRuns.reduce((s: number, r: any) => s + r.distanceKm, 0)
  const avgPace = dbUser.runs.length > 0
    ? Math.round(dbUser.runs.reduce((s: number, r: any) => s + r.paceSecPerKm, 0) / dbUser.runs.length)
    : 0
  const avgPaceMin = Math.floor(avgPace / 60)
  const avgPaceSec = String(avgPace % 60).padStart(2, '0')

  return (
    <div style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      
      {/* HERO */}
      <section style={{ marginBottom: '64px' }}>
        <p style={{ fontFamily: 'monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--orange)', marginBottom: '12px' }}>
          ▶ Personal dashboard
        </p>
        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.02em', margin: '0 0 20px 0', textTransform: 'uppercase' }}>
          Welcome back, {dbUser.name.split(' ')[0]} 👋
        </h1>
          <p style={{ maxWidth: '500px', fontSize: '0.9rem', opacity: 0.7, lineHeight: 1.6 }}>
            {participantDef.cat === '10K' ? '10.5K Run' : participantDef.cat === 'HM_INT' ? '21.1K Half Marathon (Int)' : '21.1K Half Marathon (Beg)'} · Training to race Aug 23, 2026.
          </p>

          {/* NEW: Training Plan Switch Section */}
          <section style={{ marginBottom: '64px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px', color: 'var(--orange)' }}>⚙ Your Training Plan</h2>
            <p style={{ marginBottom: '16px', color: 'var(--text)' }}>You are currently on: <strong>{dbUser.runningGoal || participantDef.cat}</strong></p>
            <button
              onClick={() => setShowPlanModal(true)}
              style={{ background: 'transparent', color: 'var(--orange)', border: 'none', textDecoration: 'underline', fontFamily: 'monospace', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              Change Plan →
            </button>
          </section>

          {/* Plan Selection Modal */}
          {showPlanModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '500px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--orange)' }}>Select a Training Plan</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {[
                    { id: '10K', label: '10K Plan', description: '10.5km race · 239 km total training · Mon/Tue · Wed/Thu · Fri/Sat · Sun' },
                    { id: 'HM', label: 'Half Marathon Plan', description: '21.1km race · 364 km total training · Mon/Tue · Wed/Thu · Fri/Sat · Sun' },
                    { id: 'HM_INT', label: 'Half Marathon Intermediate', description: '21.1km race · ~10–15% more volume than standard HM, peak long run 22–24km' },
                  ].map(plan => (
                    <div key={plan.id} style={{ border: '1px solid var(--border)', borderRadius: '4px', padding: '12px', cursor: 'pointer', background: selectedPlan === plan.id ? 'rgba(252,76,2,0.1)' : 'transparent' }}
                      onClick={() => setSelectedPlan(plan.id)}>
                      <strong>{plan.label}</strong>
                      <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>{plan.description}</p>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button onClick={() => setShowPlanModal(false)} style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px', padding: '8px 12px', fontFamily: 'monospace', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                  <button
                    onClick={async () => {
                      if (!selectedPlan) return;
                      if (selectedPlan === (dbUser.runningGoal || participantDef.cat)) {
                        alert("You're already on this plan.");
                        return;
                      }
                      const res = await fetch('/api/user/plan', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: dbUser.id, plan: selectedPlan })
                      });
                      if (res.ok) {
                        window.location.reload();
                      } else {
                        const err = await res.text();
                        alert('Failed to change plan: ' + err);
                      }
                    }}
                    style={{ background: 'var(--orange)', color: '#000', border: 'none', borderRadius: '4px', padding: '8px 16px', fontFamily: 'monospace', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Yes, Switch
                  </button>
                </div>
              </div>
            </div>
          )}

      </section>

      {/* ── MISSED RUN ALERT ─────────────────────────────── */}
      <MissedRunAlert runs={dbUser.runs} participantDef={participantDef} userId={dbUser?.id} />

      {/* ── ACHIEVEMENTS / BADGES ───────────────────────── */}
      <section style={{ marginBottom: '80px' }}>
        <SectionHead label="🏆 Achievements" title="YOUR BADGES" />
        <AchievementsBadges runs={dbUser.runs} />
      </section>

      {/* ── RACE DAY CHECKLIST ──────────────────────────── */}
      <RaceDayChecklist userId={dbUser?.id} />

      {/* 01 — LOG A RUN */}
      <section style={{ marginBottom: '80px' }}>
        <SectionHead label="01 / Log Run" title="ADD YOUR SESSION" />
        <div className="log-form">
          {success && (
            <div style={{ background: '#4ade8020', border: '1px solid #4ade80', borderRadius: '4px', padding: '12px 16px', marginBottom: '20px', color: '#4ade80', fontFamily: 'monospace', fontSize: '13px' }}>
              ✓ Run logged! Refreshing...
            </div>
          )}
          <form onSubmit={handleLogRun} className="form-row">
            <div className="form-group">
              <label className="form-label">Distance (km)</label>
              <input
                type="number" step="0.01" min="0.01" required
                value={distance} onChange={e => setDistance(e.target.value)}
                placeholder="5.00" className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date" required
                value={date} onChange={e => setDate(e.target.value)}
                className="form-input"
              />
            </div>
            <div style={{ width: '100%', fontFamily: 'monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.8, color: 'var(--accent)', marginTop: '4px', marginBottom: '-4px' }}>Enter Pace OR Duration (optional)</div>
            <div className="form-group">
              <label className="form-label">Pace (MM:SS)</label>
              <input
                type="text" placeholder="5:30"
                value={pace} onChange={e => setPace(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Duration (HH:MM:SS) <span style={{ opacity: 0.5, fontWeight: 'normal' }}>(optional)</span></label>
              <input
                type="text" placeholder="45:00"
                value={duration} onChange={e => setDuration(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Avg Heart Rate (bpm) <span style={{ opacity: 0.5, fontWeight: 'normal' }}>(optional)</span></label>
              <input
                type="number" placeholder="e.g. 152" min="40" max="220"
                value={heartRate} onChange={e => setHeartRate(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ width: '100%' }}>
              <label className="form-label">Notes</label>
              <input
                type="text" placeholder="Felt great!"
                value={notes} onChange={e => setNotes(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ justifyContent: 'flex-end' }}>
              <button
                type="submit" disabled={loading}
                style={{ width: '100%', background: 'var(--orange)', color: '#000', border: 'none', borderRadius: '4px', minHeight: '44px', fontFamily: 'monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Saving...' : '+ Save Run'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 02 — SNAPSHOT */}
      <section style={{ marginBottom: '80px' }}>
        <SectionHead label="02 / This Week" title="SNAPSHOT" />
        <div className="stats-row" style={{ border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden', background: 'var(--border)' }}>
          <StatBox label="KM Done (All Time)" value={actualKm.toFixed(2)} unit="km" sub={`of ${totalTarget} km total plan`} />
          <StatBox label="Plan Completion" value={`${pct}`} unit="%" sub={status === 'green' ? '✓ On track' : status === 'yellow' ? '~ Almost there' : '✕ Catch up!'} />
          <StatBox label="This Week" value={weekKm.toFixed(2)} unit="km" sub={`${weekRuns.length} sessions`} />
          <StatBox label="Avg Pace" value={avgPace > 0 ? `${avgPaceMin}:${avgPaceSec}` : '—'} unit="/km" sub={`across ${dbUser.runs.length} runs`} />
        </div>
      </section>

      {/* 03 — RECENT RUNS */}
      {dbUser.runs.length > 0 && (
        <section style={{ marginBottom: '80px' }}>
          <SectionHead label="03 / History" title="YOUR RUNS" />

          {/* Total Summary Tiles */}
          {(() => {
            const totalRuns = dbUser.runs.length;
            const totalTimeSec = dbUser.runs.reduce((s: number, r: any) => s + (r.durationSec || 0), 0);
            const totalTimeHrs = Math.floor(totalTimeSec / 3600);
            const totalTimeMins = Math.floor((totalTimeSec % 3600) / 60);
            const avgPaceTotal = totalRuns > 0 ? Math.round(dbUser.runs.reduce((s: number, r: any) => s + (r.paceSecPerKm || 0), 0) / totalRuns) : 0;
            const avgPaceTotalMin = Math.floor(avgPaceTotal / 60);
            const avgPaceTotalSec = String(avgPaceTotal % 60).padStart(2, '0');
            const tiles = [
              { label: 'TOTAL DISTANCE', value: actualKm.toFixed(1), unit: 'KM', accent: true },
              { label: 'TOTAL TIME', value: `${totalTimeHrs}h ${totalTimeMins}m`, unit: '', accent: false },
              { label: 'TOTAL RUNS', value: String(totalRuns), unit: '', accent: false },
              { label: 'AVG PACE', value: `${avgPaceTotalMin}:${avgPaceTotalSec}`, unit: '/km', accent: false },
            ];
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2px', marginBottom: '48px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                {tiles.map((t, i) => (
                  <div key={i} style={{
                    background: t.accent ? 'rgba(252,76,2,0.12)' : 'var(--surface)',
                    padding: '28px 24px',
                    borderRight: i < tiles.length - 1 ? '1px solid var(--border)' : 'none',
                    position: 'relative', overflow: 'hidden'
                  }}>
                    {t.accent && <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: 'var(--orange)' }} />}
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: 'var(--muted)', marginBottom: '12px', textTransform: 'uppercase' }}>{t.label}</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.8rem', lineHeight: 1, color: t.accent ? 'var(--orange)' : 'var(--text)' }}>
                      {t.value}<span style={{ fontSize: '1rem', color: 'var(--muted)', marginLeft: '4px', fontFamily: 'monospace' }}>{t.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Activity Feed Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {dbUser.runs.slice(0, 15).map((r: any, idx: number) => {
              const d = new Date(r.date);
              const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
              const dayStr = d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
              const yearStr = d.getFullYear();
              const paceMin = Math.floor(r.paceSecPerKm / 60);
              const paceSec = String(r.paceSecPerKm % 60).padStart(2, '0');
              const hrs = Math.floor(r.durationSec / 3600);
              const mins = Math.floor((r.durationSec % 3600) / 60);
              const secs = String(r.durationSec % 60).padStart(2, '0');
              const durationStr = hrs > 0
                ? `${hrs}:${String(mins).padStart(2, '0')}:${secs}`
                : `${String(mins).padStart(2, '0')}:${secs}`;

              const notesLower = (r.notes || '').toLowerCase();
              let effort: { label: string; color: string; bg: string } | null = null;
              if (notesLower.includes('hard')) effort = { label: 'HARD', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
              else if (notesLower.includes('moderate') || notesLower.includes('mod')) effort = { label: 'MODERATE', color: '#facc15', bg: 'rgba(250,204,21,0.12)' };
              else if (notesLower.includes('easy')) effort = { label: 'EASY', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' };

              const isLast = idx === Math.min(dbUser.runs.length, 15) - 1;

              return (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'stretch', gap: '0',
                  borderBottom: isLast ? 'none' : '1px solid var(--border)',
                }}>
                  {/* Left accent + run number */}
                  <div style={{
                    width: '56px', flexShrink: 0,
                    background: 'var(--surface)',
                    borderLeft: '3px solid var(--orange)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '20px 0', gap: '6px',
                    borderRight: '1px solid var(--border)',
                  }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--muted)', letterSpacing: '1px' }}>RUN</span>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: 'var(--orange)', lineHeight: 1 }}>{dbUser.runs.length - idx}</span>
                  </div>

                  {/* Date block */}
                  <div style={{
                    width: '72px', flexShrink: 0,
                    background: 'var(--surface)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '20px 8px',
                    borderRight: '1px solid var(--border)',
                  }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--muted)', letterSpacing: '1px' }}>{dayStr}</span>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', color: 'var(--text)', lineHeight: 1.1, textAlign: 'center' }}>{dateStr}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--muted)', marginTop: '2px' }}>{yearStr}</span>
                  </div>

                  {/* Main content */}
                  <div style={{
                    flex: 1, background: 'var(--surface)',
                    display: 'flex', alignItems: 'center',
                    padding: '20px 28px', gap: '32px', flexWrap: 'wrap',
                  }}>
                    {/* Distance — hero number */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', minWidth: '100px' }}>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '3rem', color: 'var(--orange)', lineHeight: 1 }}>
                        {r.distanceKm.toFixed(2)}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', fontWeight: 700, letterSpacing: '1px' }}>KM</span>
                    </div>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '36px', background: 'var(--border)', flexShrink: 0 }} />

                    {/* Pace */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Pace</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>{paceMin}:{paceSec}<span style={{ fontSize: '0.7rem', color: 'var(--muted)', marginLeft: '2px' }}>/km</span></span>
                    </div>

                    {/* Time */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Duration</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>{durationStr}</span>
                    </div>

                    {/* Effort pill */}
                    {effort && (
                      <span style={{
                        padding: '4px 12px', borderRadius: '20px',
                        background: effort.bg, color: effort.color,
                        fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em'
                      }}>{effort.label}</span>
                    )}

                    {/* Notes */}
                    {r.notes && (
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic', marginLeft: 'auto', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        "{r.notes}"
                      </span>
                    )}
                  </div>

                  {/* Delete button */}
                  <div style={{
                    width: '52px', flexShrink: 0,
                    background: 'var(--surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderLeft: '1px solid var(--border)',
                  }}>
                    <button
                      onClick={() => handleDeleteRun(r.id)}
                      title="Delete run"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--muted)', fontSize: '16px', padding: '8px',
                        borderRadius: '4px', transition: 'color 0.2s, background 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px'
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 04 — INTEGRATIONS */}
      <section style={{ marginBottom: '80px' }}>
        <SectionHead label="04 / Integrations" title="CONNECT YOUR DEVICES" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {(Object.keys(providerMeta) as Provider[]).map(p => (
            <ProviderCard
              key={p}
              provider={p}
              connected={connected[p]}
              onToggle={() => toggle(p)}
            />
          ))}
        </div>
      </section>

      {/* 05 — METRICS DECODED */}
      <section style={{ marginBottom: '80px' }}>
        <SectionHead label="05 / Metrics decoded" title="WHAT YOUR WATCH IS TELLING YOU" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {metrics.map(m => (
            <div key={m.title} style={{ border: '1px solid var(--border)', borderRadius: '4px', padding: '24px', background: 'var(--surface)', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--orange)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(252,76,2,0.1)', borderRadius: '4px', fontSize: '16px' }}>{m.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>{m.title}</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', lineHeight: 1.6 }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.5, marginBottom: '4px' }}>What</div>
                  <div style={{ opacity: 0.85 }}>{m.what}</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.5, marginBottom: '4px' }}>Why it matters</div>
                  <div style={{ opacity: 0.85 }}>{m.why}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', background: 'rgba(252,76,2,0.05)', border: '1px solid rgba(252,76,2,0.2)', borderRadius: '4px', padding: '10px 12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--orange)', flexShrink: 0 }}>ℹ</span>
                  <p style={{ fontFamily: 'monospace', fontSize: '11px', margin: 0 }}>{m.good}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 06 — HR ZONES */}
      <section style={{ marginBottom: '80px' }}>
        <SectionHead label="06 / Heart rate zones" title="TRAINING INTENSITY" />
        <div style={{ border: '1px solid var(--border)', borderRadius: '4px', padding: '28px', background: 'var(--surface)' }}>
          <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '24px', lineHeight: 1.7 }}>
            Your week split across the 5 zones. Most runners should spend{' '}
            <strong style={{ color: 'var(--text)' }}>80% in Z1–Z2</strong> (easy) and only{' '}
            <strong style={{ color: 'var(--text)' }}>20% in Z4–Z5</strong> (hard). This is polarized training.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {zones.map(z => (
              <div key={z.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{z.name} · {z.range}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', opacity: 0.6 }}>{z.pct}%</span>
                </div>
                <div style={{ height: '8px', borderRadius: '9999px', background: 'var(--border)', overflow: 'hidden', marginBottom: '4px' }}>
                  <div style={{ height: '100%', width: `${z.pct}%`, background: z.color, borderRadius: '9999px' }} />
                </div>
                <p style={{ fontSize: '11px', opacity: 0.55, margin: 0 }}>{z.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI COACH WIDGET */}
      <AICoachWidget userId={dbUser.id} />

    </div>
  )
}


// ─── MISSED RUN ALERT ─────────────────────────────────────────────────────────
function MissedRunAlert({ runs, participantDef, userId }: { runs: any[]; participantDef: any; userId: string }) {
  const DISMISS_KEY = `missed_dismiss_${userId}`
  const [dismissed, setDismissed] = useState(false)
  const [prefillDate, setPrefillDate] = useState<string | null>(null)

  useEffect(() => {
    const val = localStorage.getItem(DISMISS_KEY)
    if (val && Date.now() < parseInt(val)) setDismissed(true)
  }, [DISMISS_KEY])

  // Compute this week's Mon–Sun
  const now = new Date()
  const dayOfWeek = (now.getDay() + 6) % 7 // Mon=0
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - dayOfWeek); weekStart.setHours(0, 0, 0, 0)

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Runs logged this week
  const weekRunDates = new Set(
    runs
      .filter(r => new Date(r.date) >= weekStart)
      .map(r => new Date(r.date).toISOString().split('T')[0])
  )
  const weekKm = runs.filter(r => new Date(r.date) >= weekStart).reduce((s, r) => s + r.distanceKm, 0)

  // Get current week plan
  const { getPlan, getWeekIdx } = require('../../lib/planData') as any
  const cwi = getWeekIdx(now)
  if (cwi < 0) return null
  const weekPlan = getPlan(participantDef)[cwi]
  const weekTarget = weekPlan?.total || 0

  // If weekly total >= target, no alert needed
  if (weekKm >= weekTarget) return null

  // Paired blocks missed runs check
  const blocks = [
    { name: 'Mon/Tue', days: [0, 1], planKey: 'tue', targetDay: 1 },
    { name: 'Wed/Thu', days: [2, 3], planKey: 'thu', targetDay: 3 },
    { name: 'Fri/Sat', days: [4, 5], planKey: 'sat', targetDay: 5 },
    { name: 'Sun', days: [6], planKey: 'sun', targetDay: 6 }
  ]

  // Find missed days
  const missedDays: { label: string; date: string; km: number }[] = []
  for (const block of blocks) {
    const lastDayOfBlock = block.days[block.days.length - 1]
    if (dayOfWeek <= lastDayOfBlock) continue // block has not fully passed yet

    let runLogged = false
    for (const dayIdx of block.days) {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + dayIdx)
      const dateStr = d.toISOString().split('T')[0]
      if (weekRunDates.has(dateStr)) {
        runLogged = true
        break
      }
    }

    if (!runLogged) {
      const targetDate = new Date(weekStart)
      targetDate.setDate(weekStart.getDate() + block.targetDay)
      const dateStr = targetDate.toISOString().split('T')[0]
      const plannedKm = weekPlan?.[block.planKey] || 0
      missedDays.push({
        label: `${block.name}, ${targetDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
        date: dateStr,
        km: plannedKm
      })
    }
  }

  if (missedDays.length === 0 || dismissed) return null

  const missed = missedDays[0]
  const remaining = weekTarget - weekKm
  let suggestion = ''
  if (missedDays.length === 1) suggestion = `Add an extra easy ${missed.km} km to your next run, or split it across your remaining days this week.`
  else if (missedDays.length === 2) suggestion = `You're ${remaining.toFixed(1)} km behind this week. Spread the catch-up across your remaining days — don't try to do it all at once.`
  else suggestion = `This week was tough — that's okay. Focus on showing up next week and don't try to make it all up at once. Consistency beats heroics.`

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 24 * 60 * 60 * 1000))
    setDismissed(true)
  }

  const scrollToLogForm = (date: string) => {
    document.getElementById('log-run-date-input')?.setAttribute('value', date)
    const el = document.getElementById('log-run-form')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const dateInput = document.getElementById('log-run-date-input') as HTMLInputElement
    if (dateInput) { dateInput.value = date; dateInput.dispatchEvent(new Event('input', { bubbles: true })) }
  }

  return (
    <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.4)', borderLeft: '4px solid #eab308', borderRadius: '8px', padding: '20px 24px', marginBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#eab308', marginBottom: '6px' }}>
            ⚠️ Missed run detected
          </div>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#e8e8e8' }}>
            Looks like you missed{' '}
            {missedDays.map((d, i) => <span key={d.date}>{i > 0 ? ', ' : ''}<strong>{d.label}</strong>{d.km > 0 ? `'s ${d.km} km` : ''} session</span>)}.
          </p>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#999', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Here's how to recover this week:</div>
          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#e8e8e8' }}>{suggestion}</p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#aaa' }}>Or just log it if you ran but forgot to record it →</span>
            <button
              onClick={() => scrollToLogForm(missed.date)}
              style={{ background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.4)', color: '#eab308', padding: '5px 12px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              Quick Log {missed.label} →
            </button>
          </div>
        </div>
        <button onClick={dismiss} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontFamily: 'monospace', fontSize: '12px', padding: '0 0 0 16px', whiteSpace: 'nowrap' }}>Got it ✕</button>
      </div>
    </div>
  )
}

// ─── ACHIEVEMENTS / BADGES ────────────────────────────────────────────────────
function AchievementsBadges({ runs }: { runs: any[] }) {
  const validRuns = runs || []
  
  // Longest Run badge
  const longestRun = validRuns.length > 0
    ? validRuns.reduce((best, r) => r.distanceKm > best.distanceKm ? r : best, validRuns[0])
    : null

  // Fastest Pace badge (ignore 0/null pace)
  const paceRuns = validRuns.filter(r => r.paceSecPerKm > 0)
  const fastestPaceRun = paceRuns.length > 0
    ? paceRuns.reduce((best, r) => r.paceSecPerKm < best.paceSecPerKm ? r : best, paceRuns[0])
    : null

  const now = new Date()
  const dayOfWeek = (now.getDay() + 6) % 7
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - dayOfWeek); weekStart.setHours(0,0,0,0)
  const thisWeek = (dateStr: string) => new Date(dateStr) >= weekStart

  const daysAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
    return diff === 0 ? 'today' : diff === 1 ? '1 day ago' : `${diff} days ago`
  }

  const badges = [
    {
      key: 'longest',
      icon: '🏅',
      name: 'Longest Run',
      earned: !!longestRun,
      value: longestRun ? `${longestRun.distanceKm.toFixed(2)} km` : null,
      date: longestRun ? new Date(longestRun.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
      ago: longestRun ? daysAgo(longestRun.date) : null,
      newThisWeek: longestRun ? thisWeek(longestRun.date) : false,
      color: '#FC4C02',
    },
    {
      key: 'fastest',
      icon: '⚡',
      name: 'Fastest Pace',
      earned: !!fastestPaceRun,
      value: fastestPaceRun ? `${Math.floor(fastestPaceRun.paceSecPerKm / 60)}:${String(fastestPaceRun.paceSecPerKm % 60).padStart(2, '0')} /km` : null,
      date: fastestPaceRun ? new Date(fastestPaceRun.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
      ago: fastestPaceRun ? daysAgo(fastestPaceRun.date) : null,
      newThisWeek: fastestPaceRun ? thisWeek(fastestPaceRun.date) : false,
      color: '#facc15',
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
      {badges.map(b => (
        <div key={b.key} style={{
          background: b.earned ? 'var(--surface)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${b.earned ? (b.newThisWeek ? b.color : 'var(--border)') : 'var(--border)'}`,
          borderRadius: '12px', padding: '24px',
          boxShadow: b.newThisWeek ? `0 0 24px ${b.color}30` : 'none',
          transition: 'all 0.3s',
          opacity: b.earned ? 1 : 0.4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '2rem', filter: b.earned ? 'none' : 'grayscale(1)' }}>{b.icon}</span>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: b.earned ? b.color : '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{b.name}</div>
              {b.newThisWeek && <div style={{ fontFamily: 'monospace', fontSize: '9px', background: `${b.color}20`, color: b.color, padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>NEW THIS WEEK</div>}
            </div>
          </div>
          {b.earned ? (
            <>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', color: b.color, lineHeight: 1, marginBottom: '8px' }}>{b.value}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#555' }}>Set on {b.date} · {b.ago}</div>
            </>
          ) : (
            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#444' }}>Not yet earned — keep running!</div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── RACE DAY CHECKLIST ───────────────────────────────────────────────────────
const CHECKLIST_SECTIONS = [
  {
    id: 'week_before',
    title: 'Week Before Race',
    opens: new Date('2026-08-16T00:00:00+05:30'),
    items: [
      'Confirm race registration and bib collection details',
      'Lay out race kit — shoes, socks, shorts, shirt, watch',
      'Do a short 20–30 min shakeout run to stay loose',
      'Cut back on new foods — stick to what you know',
      'Sleep 8+ hours every night this week',
      'Hydrate well — urine should be pale yellow',
      'Avoid alcohol the week before',
      'Charge your GPS watch fully',
    ],
  },
  {
    id: 'night_before',
    title: 'Night Before',
    opens: new Date('2026-08-22T00:00:00+05:30'),
    items: [
      'Prepare race kit and pin bib to shirt',
      'Set two alarms — one backup',
      'Prep your race morning breakfast (carbs you\'ve tested before)',
      'Fill water bottle / hydration pack',
      'Check the race venue location and parking',
      'Sleep by 10pm — nerves are normal, don\'t fight them',
      'No new shoes, no new gear tomorrow',
    ],
  },
  {
    id: 'race_morning',
    title: 'Race Morning',
    opens: new Date('2026-08-23T00:00:00+05:30'),
    items: [
      'Wake up 2.5–3 hours before race start',
      'Eat your practiced breakfast (rice/banana/toast + electrolytes)',
      'Dynamic warmup — leg swings, high knees, easy jog 5 min',
      'Arrive at venue 45 min before gun time',
      'Find your pace group / corral',
      'Start SLOWER than you think — the first 5km decides your race',
      'Enjoy it — you trained for this 🏁',
    ],
  },
]

const RACE_DAY_OPENS = new Date('2026-08-02T00:00:00+05:30')

function RaceDayChecklist({ userId }: { userId: string }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const now = new Date()
  const daysUntilOpen = Math.ceil((RACE_DAY_OPENS.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const isOpen = now >= RACE_DAY_OPENS

  useEffect(() => {
    if (!userId) return
    fetch(`/api/checklist?userId=${userId}`)
      .then(r => r.json())
      .then((items: any[]) => {
        const map: Record<string, boolean> = {}
        items.forEach(item => { map[item.itemKey] = item.checked })
        setChecked(map)
      })
  }, [userId])

  const toggle = async (sectionId: string, itemIdx: number, current: boolean) => {
    if (!userId) return
    const key = `${sectionId}_${itemIdx}`
    const newVal = !current
    setChecked(c => ({ ...c, [key]: newVal }))
    setLoading(key)
    await fetch('/api/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, itemKey: key, checked: newVal })
    })
    setLoading(null)
  }

  const toggleSection = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  return (
    <section style={{ marginBottom: '80px' }}>
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontFamily: 'monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--orange)', margin: '0 0 8px 0' }}>Race Day Prep</p>
        <h2 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 800, letterSpacing: '-0.01em', margin: 0 }}>🏁 RACE DAY CHECKLIST</h2>
      </div>

      {!isOpen ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '2rem' }}>🔒</span>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>Opens in {daysUntilOpen} days</div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#555' }}>Race day prep checklist unlocks Aug 2, 2026</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {CHECKLIST_SECTIONS.map(section => {
            const isAvailable = now >= section.opens
            const doneCount = section.items.filter((_, i) => checked[`${section.id}_${i}`]).length
            const allDone = doneCount === section.items.length
            const isExpanded = expanded[section.id] !== false // default open

            return (
              <div key={section.id} style={{ background: 'var(--surface)', border: `1px solid ${allDone ? '#4ade8066' : 'var(--border)'}`, borderRadius: '10px', overflow: 'hidden' }}>
                <button
                  onClick={() => toggleSection(section.id)}
                  style={{ width: '100%', background: 'none', border: 'none', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: 'inherit' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700 }}>{section.title}</span>
                    {!isAvailable && <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#555', background: '#1a1a1a', padding: '2px 8px', borderRadius: '4px' }}>opens {section.opens.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {allDone ? (
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#4ade80' }}>✅ All done!</span>
                    ) : (
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#555' }}>{doneCount} / {section.items.length}</span>
                    )}
                    <span style={{ color: '#555', fontSize: '12px' }}>{isExpanded === false ? '▶' : '▼'}</span>
                  </div>
                </button>

                {isExpanded !== false && (
                  <div style={{ padding: '0 20px 16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {section.items.map((item, i) => {
                      const key = `${section.id}_${i}`
                      const isChecked = !!checked[key]
                      return (
                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < section.items.length - 1 ? '1px solid var(--border)' : 'none', cursor: isAvailable ? 'pointer' : 'default', minHeight: '44px' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={!isAvailable || loading === key}
                            onChange={() => toggle(section.id, i, isChecked)}
                            style={{ width: '18px', height: '18px', accentColor: '#4ade80', cursor: isAvailable ? 'pointer' : 'not-allowed', flexShrink: 0 }}
                          />
                          <span style={{ fontSize: '14px', color: isChecked ? '#4ade80' : isAvailable ? '#e8e8e8' : '#444', textDecoration: isChecked ? 'line-through' : 'none', lineHeight: 1.5 }}>
                            {isChecked && '✓ '}{item}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function SectionHead({ label, title }: { label: string; title: string }) {

  return (
    <div style={{ marginBottom: '24px' }}>
      <p style={{ fontFamily: 'monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--orange)', margin: '0 0 8px 0' }}>{label}</p>
      <h2 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 800, letterSpacing: '-0.01em', margin: 0 }}>{title}</h2>
    </div>
  )
}

function StatBox({ label, value, unit, sub }: { label: string; value: string; unit: string; sub: string }) {
  return (
    <div style={{ background: 'var(--surface)', padding: '24px' }}>
      <p style={{ fontFamily: 'monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.5, margin: '0 0 12px 0' }}>{label}</p>
      <p style={{ fontFamily: 'monospace', fontSize: 'clamp(1.8rem, 6vw, 2.5rem)', fontWeight: 700, margin: '0 0 8px 0', lineHeight: 1 }}>
        {value}<span style={{ fontSize: '1rem', opacity: 0.5, marginLeft: '4px' }}>{unit}</span>
      </p>
      <p style={{ fontSize: '12px', color: 'var(--orange)', margin: 0 }}>{sub}</p>
    </div>
  )
}

function ProviderCard({ provider, connected, onToggle }: { provider: Provider; connected: boolean; onToggle: () => void }) {
  const meta = providerMeta[provider]
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: '4px', padding: '24px', background: 'var(--surface)', transition: 'border-color 0.2s', cursor: 'default' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(252,76,2,0.5)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', background: meta.color, color: '#fff', fontFamily: 'monospace', fontSize: '14px', fontWeight: 700 }}>
          {meta.name[0]}
        </div>
        {connected && (
          <span style={{ fontFamily: 'monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#4ade80' }}>✓ Linked</span>
        )}
      </div>
      <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 8px 0' }}>{meta.name}</h3>
      <p style={{ fontSize: '12px', opacity: 0.6, lineHeight: 1.6, flex: 1, margin: '0 0 20px 0' }}>{meta.blurb}</p>
      <button
        disabled={true}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          border: 'none',
          background: 'var(--bg)',
          color: 'var(--text)', opacity: 0.5,
          borderRadius: '4px', padding: '10px 16px',
          fontFamily: 'monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700,
          cursor: 'not-allowed', transition: 'opacity 0.2s'
        }}
      >
        Coming Soon
      </button>
    </div>
  )
}
