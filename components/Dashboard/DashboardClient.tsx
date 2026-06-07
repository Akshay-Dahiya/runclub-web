"use client"

import React, { useState } from 'react'

type Provider = 'strava' | 'garmin' | 'apple'

const providerMeta: Record<Provider, { name: string; color: string; blurb: string }> = {
  strava: {
    name: 'Strava',
    color: '#FC4C02',
    blurb: 'Pulls activities, segments & social feed. Best for community + segment chasing.',
  },
  garmin: {
    name: 'Garmin Connect',
    color: '#007CC3',
    blurb: 'Deep biometrics — HRV, body battery, training load, VO2 max, sleep & recovery.',
  },
  apple: {
    name: 'Apple Watch',
    color: '#888',
    blurb: 'HealthKit sync — heart rate, workouts, rings, cardio fitness, walking steadiness.',
  },
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
  dbUser,
  participantDef,
  actualKm,
  plannedKm,
  status,
  pct,
  totalTarget
}: any) {
  const [connected, setConnected] = useState<Record<Provider, boolean>>({
    strava: false, garmin: false, apple: false,
  })
  const toggle = (p: Provider) => setConnected(c => ({ ...c, [p]: !c[p] }))

  const [distance, setDistance] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [pace, setPace] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleLogRun = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Parse pace MM:SS -> seconds/km
      let paceSecPerKm = 360
      if (pace) {
        const [mm, ss] = pace.split(':').map(Number)
        paceSecPerKm = (mm || 0) * 60 + (ss || 0)
      }
      const distKm = parseFloat(distance)
      const durationSec = Math.round(distKm * paceSecPerKm)

      // Find userId from dbUser
      const userId = dbUser?.id
      if (!userId) { alert('User not found in database yet. Please try again later.'); setLoading(false); return }

      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, date, distanceKm: distKm, paceSecPerKm, durationSec, notes })
      })
      if (!res.ok) throw new Error('Failed to log run')
      setSuccess(true)
      setDistance(''); setPace(''); setNotes('')
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
          ▶ Personal dashboard · {dbUser.name}
        </p>
        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.02em', margin: '0 0 20px 0' }}>
          EVERY MILE,<br />
          <span style={{ color: 'var(--orange)' }}>MEASURED.</span>
        </h1>
        <p style={{ maxWidth: '500px', fontSize: '0.9rem', opacity: 0.7, lineHeight: 1.6 }}>
          {participantDef.cat === 'HM' ? '21.1K Half Marathon' : '10.5K Run'} · Training to race Aug 23, 2026.
          Connect your watch or log manually. Every km counts.
        </p>
      </section>

      {/* 01 — INTEGRATIONS */}
      <section style={{ marginBottom: '80px' }}>
        <SectionHead label="01 / Integrations" title="CONNECT YOUR DEVICES" />
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

      {/* 02 — SNAPSHOT */}
      <section style={{ marginBottom: '80px' }}>
        <SectionHead label="02 / This Week" title="SNAPSHOT" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden', background: 'var(--border)' }}>
          <StatBox label="KM Done (All Time)" value={actualKm.toFixed(1)} unit="km" sub={`of ${totalTarget} km total plan`} />
          <StatBox label="Plan Completion" value={`${pct}`} unit="%" sub={status === 'green' ? '✓ On track' : status === 'yellow' ? '~ Almost there' : '✕ Catch up!'} />
          <StatBox label="This Week" value={weekKm.toFixed(1)} unit="km" sub={`${weekRuns.length} sessions`} />
          <StatBox label="Avg Pace" value={avgPace > 0 ? `${avgPaceMin}:${avgPaceSec}` : '—'} unit="/km" sub={`across ${dbUser.runs.length} runs`} />
        </div>
      </section>

      {/* 03 — LOG A RUN */}
      <section style={{ marginBottom: '80px' }}>
        <SectionHead label="03 / Log Run" title="ADD YOUR SESSION" />
        <div style={{ border: '1px solid var(--border)', borderRadius: '4px', padding: '28px', background: 'var(--surface)' }}>
          {success && (
            <div style={{ background: '#4ade8020', border: '1px solid #4ade80', borderRadius: '4px', padding: '12px 16px', marginBottom: '20px', color: '#4ade80', fontFamily: 'monospace', fontSize: '13px' }}>
              ✓ Run logged! Refreshing...
            </div>
          )}
          <form onSubmit={handleLogRun} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.6 }}>Distance (km)</label>
              <input
                type="number" step="0.1" min="0" required
                value={distance} onChange={e => setDistance(e.target.value)}
                placeholder="5.0"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px', padding: '10px 12px', color: 'var(--text)', fontFamily: 'monospace', fontSize: '14px', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.6 }}>Date</label>
              <input
                type="date" required
                value={date} onChange={e => setDate(e.target.value)}
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px', padding: '10px 12px', color: 'var(--text)', fontFamily: 'monospace', fontSize: '14px', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.6 }}>Pace (MM:SS)</label>
              <input
                type="text" placeholder="5:30"
                value={pace} onChange={e => setPace(e.target.value)}
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px', padding: '10px 12px', color: 'var(--text)', fontFamily: 'monospace', fontSize: '14px', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.6 }}>Notes</label>
              <input
                type="text" placeholder="Felt great!"
                value={notes} onChange={e => setNotes(e.target.value)}
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px', padding: '10px 12px', color: 'var(--text)', fontFamily: 'monospace', fontSize: '14px', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="submit" disabled={loading}
                style={{ width: '100%', background: 'var(--orange)', color: '#000', border: 'none', borderRadius: '4px', padding: '11px 20px', fontFamily: 'monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Saving...' : '+ Save Run'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 04 — RECENT RUNS */}
      {dbUser.runs.length > 0 && (
        <section style={{ marginBottom: '80px' }}>
          <SectionHead label="04 / History" title="YOUR RUNS" />
          <div style={{ border: '1px solid var(--border)', borderRadius: '4px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Date', 'Distance', 'Pace', 'Duration', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.5, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dbUser.runs.slice(0, 15).map((r: any, i: number) => {
                  const d = new Date(r.date)
                  const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                  const paceMin = Math.floor(r.paceSecPerKm / 60)
                  const paceSec = String(r.paceSecPerKm % 60).padStart(2, '0')
                  const durMin = Math.floor(r.durationSec / 60)
                  const durSec = String(r.durationSec % 60).padStart(2, '0')
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--surface)' }}>
                      <td style={{ padding: '12px 16px', opacity: 0.7 }}>{dateStr}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--orange)', fontWeight: 700 }}>{r.distanceKm.toFixed(1)} km</td>
                      <td style={{ padding: '12px 16px', opacity: 0.8 }}>{paceMin}:{paceSec} /km</td>
                      <td style={{ padding: '12px 16px', opacity: 0.8 }}>{durMin}:{durSec}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button onClick={() => handleDeleteRun(r.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontFamily: 'monospace', fontSize: '11px', opacity: 0.7 }}>delete</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

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

    </div>
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
        onClick={onToggle}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          border: connected ? '1px solid var(--border)' : 'none',
          background: connected ? 'var(--bg)' : 'var(--orange)',
          color: connected ? 'var(--text)' : '#000',
          borderRadius: '4px', padding: '10px 16px',
          fontFamily: 'monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700,
          cursor: 'pointer', transition: 'opacity 0.2s'
        }}
      >
        {connected ? 'Disconnect' : '+ Connect'}
      </button>
    </div>
  )
}
