"use client"

import React, { useState } from 'react'

export default function DashboardClient({
  dbUser,
  participantDef,
  actualKm,
  plannedKm,
  status,
  pct,
  totalTarget
}: any) {
  const [distance, setDistance] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [pace, setPace] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [stravaConnected, setStravaConnected] = useState(false) // Stub for Strava connection

  const weekNumber = 5 // Hardcoded for demo purposes

  const handleLogRun = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('email', participantDef.email)
      formData.append('distance', distance)
      formData.append('date', date)
      formData.append('pace', pace)
      // notes and heartRate not supported on backend yet, but UI accepts them

      // Wait 1 second to mock network request
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Reload page to fetch new data (in reality we would use server actions and router.refresh())
      window.location.reload()
    } catch (error) {
      console.error(error)
      alert("Failed to log run")
    } finally {
      setLoading(false)
    }
  }

  // Helper for progress ring stroke
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (pct / 100) * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* HEADER SECTION: Welcome & Strava */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
        <div>
          <h2 className="section-title">Welcome, {dbUser.name}</h2>
          <span className={`p-category ${participantDef.cat === 'HM' ? 'cat-hm' : 'cat-10k'}`} style={{ display: 'inline-block' }}>
            {participantDef.cat === 'HM' ? '21.1K Half Marathon Training' : '10.5K Run Training'}
          </span>
        </div>
        
        {/* STRAVA BLOCK */}
        <div style={{ background: stravaConnected ? '#f0f9f0' : '#fc4c0215', border: `1px solid ${stravaConnected ? 'var(--green)' : '#fc4c02'}`, padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: stravaConnected ? 'var(--green)' : '#fc4c02' }}>
              {stravaConnected ? 'Strava Connected' : 'Connect Strava'}
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>
              {stravaConnected ? 'Your runs sync automatically.' : 'Sync runs and get advanced charts.'}
            </p>
          </div>
          <button 
            onClick={() => setStravaConnected(!stravaConnected)}
            className="btn-primary" 
            style={{ 
              background: stravaConnected ? 'transparent' : '#fc4c02', 
              color: stravaConnected ? 'var(--green)' : 'white', 
              border: stravaConnected ? '1px solid var(--green)' : 'none', 
              padding: '8px 16px', 
              borderRadius: '4px', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}
          >
            {stravaConnected ? 'Sync Now' : 'Connect'}
          </button>
        </div>
      </div>

      {/* 5 STAT BOXES & PROGRESS RING */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Progress Ring Box */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '200px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', opacity: 0.7, textTransform: 'uppercase' }}>Plan Completion</h4>
          <div style={{ position: 'relative', width: '100px', height: '100px' }}>
            <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--border)" strokeWidth="8" />
              {/* Progress circle */}
              <circle 
                cx="50" 
                cy="50" 
                r={radius} 
                fill="none" 
                stroke={`var(--${status})`} 
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{pct}%</span>
            </div>
          </div>
        </div>

        {/* 5 Stats Grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '8px' }}>KM Logged</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text)' }}>{actualKm.toFixed(1)}</div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '8px' }}>KM Planned</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text)' }}>{plannedKm.toFixed(0)}</div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '8px' }}>Runs Done</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text)' }}>{dbUser.runs.length}</div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '8px' }}>Current Week</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text)' }}>{weekNumber} <span style={{fontSize: '1rem', opacity: 0.5}}>/ 10</span></div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
        
        {/* WEEKLY SCHEDULE & 10-WEEK BARS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* This Week's Schedule */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', fontFamily: "'Bebas Neue', sans-serif" }}>This Week's Schedule</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {['Tue', 'Thu', 'Sat', 'Sun'].map((day, i) => {
                const isToday = i === 1; // MOCK: Thu is today
                return (
                  <div key={day} style={{ 
                    background: isToday ? '#fc4c0220' : 'transparent',
                    border: `1px solid ${isToday ? '#fc4c02' : 'var(--border)'}`, 
                    borderRadius: '8px', 
                    padding: '12px 8px', 
                    textAlign: 'center' 
                  }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: isToday ? '#fc4c02' : 'var(--text)', opacity: isToday ? 1 : 0.6 }}>{day}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '4px' }}>
                      {participantDef.cat === 'HM' ? ['5k', '5k', '5k', '12k'][i] : ['3k', '3k', '3k', '7k'][i]}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 10-Week Progress Bars */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', fontFamily: "'Bebas Neue', sans-serif" }}>10-Week Plan Progress</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3, 4, 5].map(wk => {
                const isCurrent = wk === weekNumber
                const done = wk < weekNumber ? 100 : isCurrent ? 60 : 0
                return (
                  <div key={wk} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', fontSize: '0.8rem', opacity: isCurrent ? 1 : 0.6, fontWeight: isCurrent ? 'bold' : 'normal' }}>Wk {wk}</div>
                    <div style={{ flex: 1, height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${done}%`, background: wk < weekNumber ? 'var(--green)' : '#fc4c02', transition: 'width 1s ease' }}></div>
                    </div>
                  </div>
                )
              })}
              <div style={{ fontSize: '0.8rem', opacity: 0.5, textAlign: 'center', marginTop: '8px' }}>... Weeks 6-10 hidden</div>
            </div>
          </div>
        </div>

        {/* LOG RUN FORM */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', fontFamily: "'Bebas Neue', sans-serif" }}>Log A Run</h3>
          <form onSubmit={handleLogRun} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Distance (KM)</label>
                <input className="form-input" type="number" step="0.1" value={distance} onChange={e => setDistance(e.target.value)} required />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Pace (MM:SS)</label>
                <input className="form-input" type="text" placeholder="5:30" value={pace} onChange={e => setPace(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Avg Heart Rate</label>
                <input className="form-input" type="number" placeholder="145" />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows={2} placeholder="How did it feel?" value={notes} onChange={e => setNotes(e.target.value)}></textarea>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
              {loading ? 'Logging...' : 'Save Run'}
            </button>
          </form>
        </div>
      </div>

      {/* RECENT RUNS */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', fontFamily: "'Bebas Neue', sans-serif" }}>Recent Runs</h3>
        <div className="table-responsive">
          <table className="lb-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Distance</th>
                <th>Pace</th>
                <th>Duration</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dbUser.runs.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', opacity: 0.5 }}>No runs logged yet.</td></tr>
              ) : (
                dbUser.runs.slice(0, 15).map((r: any) => {
                  const d = new Date(r.date)
                  const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                  const paceMin = Math.floor(r.paceSecPerKm / 60)
                  const paceSec = String(r.paceSecPerKm % 60).padStart(2, '0')
                  const durMin = Math.floor(r.durationSec / 60)
                  const durSec = String(r.durationSec % 60).padStart(2, '0')
                  
                  return (
                    <tr key={r.id}>
                      <td>{dateStr}</td>
                      <td style={{ color: 'var(--green)', fontWeight: 'bold' }}>{r.distanceKm.toFixed(1)} km</td>
                      <td className="lb-mono">{paceMin}:{paceSec} /km</td>
                      <td className="lb-mono">{durMin}:{durSec}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '0.85rem' }}>Delete</button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
