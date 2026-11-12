'use client'

import { useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'

type WellnessDay = {
  id: string
  date: string
  data: Record<string, number | null>
}

type GarminActivity = {
  externalId: string
  date: string
  data: { distanceKm?: number; durationSec?: number; paceSecPerKm?: number; avgHeartRate?: number | null }
}

export default function GarminPanel({ userId }: { userId: string }) {
  const { data: session, status } = useSession()
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id
  const isOwner = status === 'authenticated' && sessionUserId === userId
  const [wellness, setWellness] = useState<WellnessDay[]>([])
  const [activities, setActivities] = useState<GarminActivity[]>([])
  const [token, setToken] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function refresh() {
    if (!isOwner) return
    const response = await fetch(`/api/garmin?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Could not load Garmin data.')
    setWellness(result.wellness)
    setActivities(result.activities)
  }

  useEffect(() => {
    refresh().catch(error => setMessage(error.message))
  }, [isOwner, userId])

  async function connect() {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/garmin/credential', { method: 'POST' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not connect Garmin.')
      setToken(result.token)
      setMessage('RunClub token created. Your Garmin password remains on your computer.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not connect Garmin.')
    } finally {
      setLoading(false)
    }
  }

  async function copyToken() {
    await navigator.clipboard.writeText(token)
    setMessage('Copied the one-time token. Paste it at the hidden prompt in the local sync script.')
  }

  return (
    <section style={{ marginBottom: 80, padding: 24, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)' }} aria-labelledby="garmin-title">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <p style={{ color: 'var(--orange)', fontFamily: 'monospace', fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>06 / RECOVERY</p>
          <h2 id="garmin-title" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36 }}>Garmin wellness</h2>
          <p style={{ color: 'var(--muted)', marginTop: 6 }}>Sleep, HRV, resting heart rate, body battery, stress, steps, and readiness.</p>
        </div>
        {isOwner ? (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn-primary" disabled={loading} onClick={connect}>{loading ? 'Connecting…' : 'Connect Garmin'}</button>
            <button type="button" className="tab-btn" onClick={() => refresh().then(() => setMessage('Garmin data refreshed.')).catch(error => setMessage(error.message))}>Refresh data</button>
          </div>
        ) : status === 'authenticated' ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Sign in to the RunClub account that owns this dashboard to connect Garmin.</p>
        ) : (
          <button type="button" className="btn-primary" onClick={() => signIn()}>Sign in to connect Garmin</button>
        )}
      </div>

      {message && <p role="status" style={{ marginTop: 16, color: 'var(--muted)', fontSize: 13 }}>{message}</p>}
      {token && <div style={{ marginTop: 16, padding: 16, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--card)' }}>
        <strong>One-time RunClub upload token</strong>
        <p style={{ color: 'var(--muted)', margin: '6px 0 12px', fontSize: 13 }}>This is not your Garmin password. Copy it, then use the local sync script. The token will not be shown again.</p>
        <button type="button" className="btn-primary" onClick={copyToken}>Copy token</button>
        <button type="button" className="tab-btn" style={{ marginLeft: 8 }} onClick={() => setToken('')}>Hide token</button>
        <pre style={{ marginTop: 14, padding: 12, overflowX: 'auto', background: 'var(--surface)', fontSize: 12 }}><code>python garmin-sync/sync_garmin.py --days 30 --sink runclub</code></pre>
      </div>}

      {wellness.length > 0 ? <div style={{ marginTop: 20, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
          <thead><tr>{['Date', 'Sleep', 'HRV', 'Resting HR', 'Battery', 'Stress', 'Steps', 'Readiness'].map(label => <th key={label} style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'monospace', fontSize: 10 }}>{label}</th>)}</tr></thead>
          <tbody>{wellness.map(day => <tr key={day.id}>
            <td style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>{new Date(day.date).toLocaleDateString()}</td>
            <td style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>{day.data.sleepHours ?? '—'} h</td>
            <td style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>{day.data.hrvMs ?? '—'} ms</td>
            <td style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>{day.data.restingHeartRate ?? '—'} bpm</td>
            <td style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>{day.data.bodyBatteryStart ?? '—'} → {day.data.bodyBatteryEnd ?? '—'}</td>
            <td style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>{day.data.averageStress ?? '—'}</td>
            <td style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>{day.data.steps ?? '—'}</td>
            <td style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>{day.data.trainingReadiness ?? '—'}</td>
          </tr>)}</tbody>
        </table>
      </div> : <p style={{ marginTop: 20, color: 'var(--muted)' }}>No Garmin wellness has been uploaded to this account yet.</p>}

      {activities.length > 0 && <div style={{ marginTop: 20 }}><h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24 }}>Recent Garmin runs</h3>{activities.slice(0, 7).map(activity => <div key={activity.externalId} style={{ display: 'flex', gap: 18, padding: '12px 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}><strong>{new Date(activity.date).toLocaleDateString()}</strong><span>{activity.data.distanceKm?.toFixed(2)} km</span><span>{activity.data.paceSecPerKm ? `${Math.floor(activity.data.paceSecPerKm / 60)}:${String(activity.data.paceSecPerKm % 60).padStart(2, '0')}/km` : '—'}</span><span>{activity.data.avgHeartRate ?? '—'} bpm</span></div>)}</div>}
    </section>
  )
}
