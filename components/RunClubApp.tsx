"use client"

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from './Navbar'
import Hero from './Hero'
import Footer from './Footer'
import PublicLogRunForm from './PublicLogRunForm'
import { PARTICIPANTS, currentWeekIdx, getPlan, getStatus, grandTotal, plannedKmSoFar, getWeekIdx, WEEK_STARTS, PLAN_10K, PLAN_HM_INT, PLAN_HM_BEG } from '../lib/planData'

function DashboardPicker() {
  const router = useRouter()
  const [selected, setSelected] = useState('')
  return (
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
      <select
        value={selected}
        onChange={e => setSelected(e.target.value)}
        style={{
          flex: 1, minWidth: '200px', maxWidth: '320px',
          background: 'var(--bg)', color: 'var(--text)',
          border: '1px solid var(--border)', borderRadius: '6px',
          padding: '14px 16px', fontSize: '1rem', cursor: 'pointer', outline: 'none'
        }}
      >
        <option value="">Select your name...</option>
        {PARTICIPANTS.map(p => (
          <option key={p.id} value={p.id}>{p.name} — {p.cat === '10K' ? '10K' : p.cat === 'HM_INT' ? 'Half Marathon (Int)' : 'Half Marathon (Beg)'}</option>
        ))}
      </select>
      <button
        onClick={() => { if (selected) router.push(`/dashboard/${selected}`) }}
        disabled={!selected}
        style={{
          background: selected ? 'var(--accent)' : 'var(--border)',
          color: selected ? '#000' : 'var(--text)',
          border: 'none', borderRadius: '6px',
          padding: '14px 28px', fontSize: '1rem', fontWeight: 700,
          cursor: selected ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s', whiteSpace: 'nowrap'
        }}
      >
        Open Dashboard →
      </button>
    </div>
  )
}

export default function RunClubApp({ users }: { users: any[] }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [leaderboardTab, setLeaderboardTab] = useState('overall')
  const [leaderboardSort, setLeaderboardSort] = useState('distance')
  const [activeModalPlan, setActiveModalPlan] = useState<string | null>(null)

  // Map DB Users back to the logic in PARTICIPANTS
  const mappedUsers = PARTICIPANTS.map(p => {
    const dbUser = users.find(u => u.email === p.email)
    const runs = dbUser?.runs || []
    const actualKm = runs.reduce((sum: number, r: any) => sum + r.distanceKm, 0)
    const weekRuns = runs.filter((r: any) => {
      const d = new Date(r.date)
      const now = new Date()
      const start = new Date(now); start.setDate(now.getDate() - now.getDay())
      return d >= start
    })
    const weekKm = weekRuns.reduce((sum: number, r: any) => sum + r.distanceKm, 0)
    const status = getStatus(actualKm, p)
    const totalTarget = grandTotal(p)

    // Streak logic
    let currentStreak = 0;
    if (runs.length > 0) {
      const sortedRuns = runs.map((r: any) => new Date(r.date)).sort((a: any, b: any) => b.getTime() - a.getTime())
      const today = new Date(); today.setHours(0,0,0,0);
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      
      const runDates = Array.from(new Set(sortedRuns.map((d: Date) => {
        const resetDate = new Date(d); resetDate.setHours(0,0,0,0);
        return resetDate.getTime()
      })))

      if (runDates.includes(today.getTime()) || runDates.includes(yesterday.getTime())) {
        let checkTime = runDates.includes(today.getTime()) ? today.getTime() : yesterday.getTime()
        while (true) {
          if (runDates.includes(checkTime)) {
            currentStreak++
            const nextDay = new Date(checkTime); nextDay.setDate(nextDay.getDate() - 1)
            checkTime = nextDay.getTime()
          } else {
            break
          }
        }
      }
    }

    const longestRun = runs.length > 0 ? Math.max(...runs.map((r: any) => r.distanceKm)) : 0
    const weekLongestRun = weekRuns.length > 0 ? Math.max(...weekRuns.map((r: any) => r.distanceKm)) : 0

    return { ...p, dbUser, runs, actualKm, weekKm, status, totalTarget, currentStreak, longestRun, weekLongestRun }
  })
  
  const sortedOverallUsers = [...mappedUsers].sort((a, b) => {
    return leaderboardSort === 'longest' ? b.longestRun - a.longestRun : b.actualKm - a.actualKm;
  })
  const sortedWeeklyUsers = [...mappedUsers].sort((a, b) => {
    return leaderboardSort === 'longest' ? b.weekLongestRun - a.weekLongestRun : b.weekKm - a.weekKm;
  })

  let filteredUsers = mappedUsers
  if (activeFilter === 'HM_INT') filteredUsers = mappedUsers.filter(u => u.cat === 'HM_INT')
  if (activeFilter === 'HM_BEG') filteredUsers = mappedUsers.filter(u => u.cat === 'HM_BEG')
  if (activeFilter === '10K') filteredUsers = mappedUsers.filter(u => u.cat === '10K')
  if (activeFilter === 'green') filteredUsers = mappedUsers.filter(u => u.status === 'green')
  if (activeFilter === 'red') filteredUsers = mappedUsers.filter(u => u.status === 'red')

  const totalRuns = mappedUsers.reduce((sum, u) => sum + u.runs.length, 0)
  const totalKm = mappedUsers.reduce((sum, u) => sum + u.actualKm, 0)
  const weeksLeft = Math.max(0, Math.ceil((new Date('2026-08-23').getTime() - new Date().getTime()) / (7 * 86400000)))

  const thisWeekTotalKm = mappedUsers.reduce((sum, u) => sum + u.weekKm, 0)
  const thisWeekTotalRuns = mappedUsers.reduce((sum, u) => {
    const weekRuns = u.runs.filter((r: any) => {
      const d = new Date(r.date)
      const now = new Date()
      const start = new Date(now); start.setDate(now.getDate() - now.getDay())
      return d >= start
    })
    return sum + weekRuns.length
  }, 0)
  const thisWeekActiveRunners = mappedUsers.filter(u => u.weekKm > 0).length

  // Scroll to current week in the blueprint tables on mount
  useEffect(() => {
    const currentWeekRows = document.querySelectorAll('.current-week')
    currentWeekRows.forEach(row => {
      const container = row.closest('.plan-table-container')
      if (container) {
        // Scroll the container so the row is roughly in the middle
        const containerElem = container as HTMLElement
        const rowElem = row as HTMLElement
        containerElem.scrollTop = rowElem.offsetTop - (containerElem.clientHeight / 2) + (rowElem.clientHeight / 2)
      }
    })
  }, [])

  return (
    <>
      <Navbar />
      <Hero />

      {/* THIS WEEK SUMMARY BAR */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 48px', display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>
        <div><span style={{ color: 'var(--muted)' }}>This Week:</span> <strong style={{ color: 'var(--accent)', fontSize: '1rem' }}>{thisWeekTotalKm.toFixed(1)} KM</strong></div>
        <div><span style={{ color: 'var(--muted)' }}>Runs:</span> <strong style={{ color: 'var(--text)', fontSize: '1rem' }}>{thisWeekTotalRuns}</strong></div>
        <div><span style={{ color: 'var(--muted)' }}>Active Crew:</span> <strong style={{ color: 'var(--text)', fontSize: '1rem' }}>{thisWeekActiveRunners}</strong></div>
      </div>

      {/* MEMBERS SECTION */}
      <div className="section" id="members">
        <div className="reveal visible">
          <span className="section-tag">// 01 · Participants</span>
          <h2 className="section-title">The Crew</h2>
          <p className="section-sub"><span className="live-dot"></span>Live progress vs their training plan. Green = on track. Yellow = slightly behind. Red = needs to catch up.</p>
        </div>

        <div className="stats-row reveal visible">
          <div className="stat-box"><span className="stat-num">{mappedUsers.length}</span><span className="stat-label">Runners</span></div>
          <div className="stat-box"><span className="stat-num">{totalRuns}</span><span className="stat-label">Total Runs</span></div>
          <div className="stat-box"><span className="stat-num">{Math.round(totalKm)}</span><span className="stat-label">KM Logged</span></div>
          <div className="stat-box"><span className="stat-num">{weeksLeft}</span><span className="stat-label">Weeks Left</span></div>
        </div>

        <div className="filter-tabs reveal visible">
          {['all', 'HM_INT', 'HM_BEG', '10K', 'green', 'red'].map(f => (
            <button 
              key={f}
              className={`tab-btn ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f === 'all' ? 'All Runners' : f === 'HM_INT' ? 'HM (Intermediate)' : f === 'HM_BEG' ? 'HM (Beginner)' : f === '10K' ? '10K Runners' : f === 'green' ? '✓ On Track' : '✕ Behind'}
            </button>
          ))}
        </div>

        <div className="participants-grid reveal visible">
          {filteredUsers.map(u => {
            const planned = plannedKmSoFar(u)
            const weekTarget = getPlan(u)[Math.min(currentWeekIdx(), 9)]?.total || 0
            const kmDue = Math.max(0, weekTarget - u.weekKm).toFixed(2)
            const pct = planned > 0 ? Math.min(100, Math.round((u.actualKm / planned) * 100)) : 0
            
            return (
              <div key={u.id} className={`participant-card status-${u.status}`}>
                <div className="p-header">
                  <div className={`p-avatar av-${u.status}`}>{u.initials}</div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {u.currentStreak > 2 && (
                      <span className="p-badge" style={{ background: 'var(--orange-dim)', color: 'var(--orange)', border: '1px solid var(--orange)' }}>
                        🔥 {u.currentStreak} Day Streak
                      </span>
                    )}
                    <span className={`p-badge badge-${u.status}`}>
                      {u.status === 'green' ? '✓ On Track' : u.status === 'yellow' ? '~ Close' : '✕ Behind'}
                    </span>
                  </div>
                </div>
                <div className="p-name">{u.name}</div>
                <div className="p-meta">{u.runs.length} runs · {u.actualKm.toFixed(2)} km done</div>
                <span className={`p-category ${u.cat.startsWith('HM') ? 'cat-hm' : 'cat-10k'}`}>
                  {u.cat === '10K' ? '10.5K Run' : u.cat === 'HM_INT' ? '21.1K HM (Int)' : '21.1K HM (Beg)'}
                </span>
                
                <div className="p-totals">
                  <div className="p-total-item"><div className="p-total-num">{u.actualKm.toFixed(2)}</div><div className="p-total-lbl">KM Done</div></div>
                  <div className="p-total-item"><div className="p-total-num">{kmDue}</div><div className="p-total-lbl">KM Due</div></div>
                  <div className="p-total-item"><div className="p-total-num">{pct}%</div><div className="p-total-lbl">Completion</div></div>
                  <div className="p-total-item"><div className="p-total-num">{u.totalTarget}</div><div className="p-total-lbl">Total Km</div></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <hr className="divider"/>

      {/* TRAINING PLANS */}
      <div className="section" id="plans" style={{ paddingTop: '80px' }}>
        <div className="reveal visible">
          <span className="section-tag">// 02 · Training Plans</span>
          <h2 className="section-title">The Blueprint</h2>
          <p className="section-sub">10 Weeks · 4 Days/Week · 3 Plans</p>
        </div>
        <div className="plan-wrap-3 reveal visible">
          {[
            {
              id: '10K', title: '10K Plan', badge: '10.5 KM', vol: '239 km total', days: 'Tue · Thu · Sat · Sun',
              tagline: 'Build your base and peak at race pace.', color: 'var(--orange)', bg: 'rgba(252,76,2,0.1)',
              data: PLAN_10K, totalStr: '239 km'
            },
            {
              id: 'HM_INT', title: 'Half Marathon (Int)', badge: '21.1 KM', vol: '364 km total', days: 'Tue · Thu · Sat · Sun',
              tagline: 'Go the distance. 21.1km awaits.', color: 'var(--blue)', bg: 'rgba(34,211,238,0.1)',
              data: PLAN_HM_INT, totalStr: '364 km'
            },
            {
              id: 'HM_BEG', title: 'Half Marathon (Beg)', badge: '21.1 KM', vol: '340 km total', days: 'Tue · Thu · Sat · Sun',
              tagline: 'Your first half marathon starts here.', color: 'var(--green)', bg: 'rgba(34,197,94,0.1)',
              data: PLAN_HM_BEG, totalStr: '340 km'
            }
          ].map(plan => {
            const currentWk = currentWeekIdx();
            const pctDone = Math.min(100, Math.round(((currentWk + 1) / 10) * 100));
            const runnersCount = mappedUsers.filter(u => u.cat === plan.id).length;
            const peakWeekKm = Math.max(...plan.data.map(w => Number(w.total) || 0));

            return (
              <div key={plan.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: `0 8px 30px rgba(0,0,0,0.2)`
              }}>
                {/* Header Area */}
                <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', margin: 0, letterSpacing: '1px' }}>{plan.title}</h3>
                    <span style={{ 
                      background: plan.bg, color: plan.color, border: `1px solid ${plan.color}`, 
                      padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px', fontWeight: 700 
                    }}>{plan.badge}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text)', background: 'var(--bg)', padding: '4px 8px', borderRadius: '4px' }}>{plan.vol}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', background: 'var(--bg)', padding: '4px 8px', borderRadius: '4px' }}>{plan.days}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px', minHeight: '40px' }}>{plan.tagline}</p>
                  
                  {/* Progress Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--subtle)' }}>PROGRESS</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '10px', color: plan.color }}>Wk {currentWk + 1}/10</span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pctDone}%`, background: plan.color, borderRadius: '2px' }} />
                  </div>
                </div>

                {/* Action Area */}
                <div style={{ padding: '20px 24px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={() => setActiveModalPlan(plan.id)}
                    className="btn-ghost"
                    style={{ width: '100%', padding: '12px', fontSize: '0.85rem' }}
                  >
                    View Full Plan
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <hr className="divider"/>

      {/* LEADERBOARD */}
      <div className="section" id="leaderboard" style={{ paddingTop: '80px' }}>
        <div className="reveal visible">
          <span className="section-tag">// 04 · Rankings</span>
          <h2 className="section-title">Leaderboards</h2>
          <p className="section-sub">Ranked by KM logged. Automatically synced with the database.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={`tab-btn ${leaderboardTab === 'overall' ? 'active' : ''}`} onClick={() => setLeaderboardTab('overall')}>Overall</button>
            <button className={`tab-btn ${leaderboardTab === 'weekly' ? 'active' : ''}`} onClick={() => setLeaderboardTab('weekly')}>This Week</button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={`tab-btn ${leaderboardSort === 'distance' ? 'active' : ''}`} onClick={() => setLeaderboardSort('distance')}>Total Dist.</button>
            <button className={`tab-btn ${leaderboardSort === 'longest' ? 'active' : ''}`} onClick={() => setLeaderboardSort('longest')}>Longest</button>
          </div>
        </div>

        <div className="lb-grid">
          
          {/* OVERALL LEADERBOARD */}
          {leaderboardTab === 'overall' && (
          <>
            <div className="table-responsive hidden-mobile reveal visible">
              <table className="lb-table">
                <thead>
                  <tr>
                    <th>#</th><th>Runner</th><th>{leaderboardSort === 'distance' ? 'KM Done' : 'Longest'}</th><th>Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOverallUsers.map((u, i) => {
                    const planned = plannedKmSoFar(u)
                    const pct = planned > 0 ? Math.min(100, Math.round((u.actualKm / planned) * 100)) : 0
                    const val = leaderboardSort === 'distance' ? u.actualKm : u.longestRun;
                    if (val === 0) return null; // empty state logic (skip 0s)
                    return (
                      <tr key={u.id}>
                        <td><span className={`rank-num ${i < 3 ? 'top3' : ''}`}>{i < 3 ? <span className="fire-icon">🔥</span> : ''} {i + 1}</span></td>
                        <td>
                          <Link href={`/dashboard/${u.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#000' }}>
                                {u.initials}
                              </div>
                              <span style={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>{u.name}</span>
                            </div>
                          </Link>
                        </td>
                        <td><span className="lb-km">{val.toFixed(2)} km</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '4px', background: 'var(--border)', borderRadius: '2px', minWidth: '60px' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: u.status === 'green' ? 'var(--green)' : u.status === 'yellow' ? 'var(--yellow)' : 'var(--red)', borderRadius: '2px' }}></div>
                            </div>
                            <span className="lb-mono">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {sortedOverallUsers.filter(u => (leaderboardSort === 'distance' ? u.actualKm : u.longestRun) === 0).length === sortedOverallUsers.length && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>No runs logged yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="visible-mobile reveal visible">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sortedOverallUsers.map((u, i) => {
                  const planned = plannedKmSoFar(u)
                  const pct = planned > 0 ? Math.min(100, Math.round((u.actualKm / planned) * 100)) : 0
                  const val = leaderboardSort === 'distance' ? u.actualKm : u.longestRun;
                  if (val === 0) return null;
                  return (
                    <Link key={u.id} href={`/dashboard/${u.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ 
                        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', 
                        padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' 
                      }}>
                        <div style={{ width: '50px', textAlign: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: i < 3 ? 'var(--orange)' : 'var(--muted)' }}>
                          {i < 3 ? <span className="fire-icon">🔥</span> : ''} #{i + 1}
                        </div>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#000', flexShrink: 0 }}>
                          {u.initials}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, marginBottom: '4px' }}>{u.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '4px', background: 'var(--surface)', borderRadius: '2px' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: u.status === 'green' ? 'var(--green)' : u.status === 'yellow' ? 'var(--yellow)' : 'var(--red)', borderRadius: '2px' }}></div>
                            </div>
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)' }}>{pct}%</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700 }}>{val.toFixed(1)}</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--muted)', letterSpacing: '1px' }}>KM</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
                {sortedOverallUsers.filter(u => (leaderboardSort === 'distance' ? u.actualKm : u.longestRun) === 0).length === sortedOverallUsers.length && (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>No runs logged yet.</div>
                )}
              </div>
            </div>
          </>
          )}

          {/* WEEKLY LEADERBOARD */}
          {leaderboardTab === 'weekly' && (
          <>
            <div className="table-responsive hidden-mobile reveal visible">
              <table className="lb-table">
                <thead>
                  <tr>
                    <th>#</th><th>Runner</th><th>{leaderboardSort === 'distance' ? 'KM This Week' : 'Longest Run'}</th><th>Week Target</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedWeeklyUsers.map((u, i) => {
                    const weekTarget = getPlan(u)[Math.min(currentWeekIdx(), 9)]?.total || 0
                    const pct = weekTarget > 0 ? Math.min(100, Math.round((u.weekKm / weekTarget) * 100)) : 0
                    const val = leaderboardSort === 'distance' ? u.weekKm : u.weekLongestRun;
                    if (val === 0) return null; // Empty state handling
                    return (
                      <tr key={u.id}>
                        <td><span className={`rank-num ${i < 3 ? 'top3' : ''}`}>{i < 3 ? <span className="fire-icon">🔥</span> : ''} {i + 1}</span></td>
                        <td>
                          <Link href={`/dashboard/${u.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#000' }}>
                                {u.initials}
                              </div>
                              <span style={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>{u.name}</span>
                            </div>
                          </Link>
                        </td>
                        <td><span className="lb-km" style={{ color: 'var(--blue)' }}>{val.toFixed(2)} km</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '4px', background: 'var(--border)', borderRadius: '2px', minWidth: '60px' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--blue)', borderRadius: '2px' }}></div>
                            </div>
                            <span className="lb-mono">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {sortedWeeklyUsers.filter(u => (leaderboardSort === 'distance' ? u.weekKm : u.weekLongestRun) === 0).length === sortedWeeklyUsers.length && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>No runs logged this week.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="visible-mobile reveal visible">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sortedWeeklyUsers.map((u, i) => {
                  const weekTarget = getPlan(u)[Math.min(currentWeekIdx(), 9)]?.total || 0
                  const pct = weekTarget > 0 ? Math.min(100, Math.round((u.weekKm / weekTarget) * 100)) : 0
                  const val = leaderboardSort === 'distance' ? u.weekKm : u.weekLongestRun;
                  if (val === 0) return null;
                  return (
                    <Link key={u.id} href={`/dashboard/${u.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ 
                        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', 
                        padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' 
                      }}>
                        <div style={{ width: '50px', textAlign: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: i < 3 ? 'var(--orange)' : 'var(--muted)' }}>
                          {i < 3 ? <span className="fire-icon">🔥</span> : ''} #{i + 1}
                        </div>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#000', flexShrink: 0 }}>
                          {u.initials}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, marginBottom: '4px' }}>{u.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '4px', background: 'var(--surface)', borderRadius: '2px' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--blue)', borderRadius: '2px' }}></div>
                            </div>
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)' }}>{pct}%</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: 'var(--blue)' }}>{val.toFixed(1)}</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--muted)', letterSpacing: '1px' }}>KM WK</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
                {sortedWeeklyUsers.filter(u => (leaderboardSort === 'distance' ? u.weekKm : u.weekLongestRun) === 0).length === sortedWeeklyUsers.length && (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>No runs logged this week.</div>
                )}
              </div>
            </div>
          </>
          )}
        </div>
      </div>

      {/* DASHBOARD PICKER */}
      <div id="dashboard" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 20px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <span className="section-tag">// 05 · Your Dashboard</span>
          <h2 className="section-title" style={{ marginBottom: '8px' }}>Open My Dashboard</h2>
          <p className="section-sub" style={{ marginBottom: '32px' }}>
            Select your name to view your personal stats, log runs, and see your training plan progress.
          </p>
          <DashboardPicker />
        </div>
      </div>

      <div className="section" style={{ textAlign: 'center', padding: '80px 20px', paddingBottom: '20px' }}>
        <span className="section-tag">// 06 · Quick Log</span>
        <h2 className="section-title">Log Your Progress</h2>
      </div>

      <div style={{ padding: '0 20px 80px 20px' }}>
        <PublicLogRunForm runners={PARTICIPANTS.filter(p => p.email).map(p => ({ name: p.name, email: p.email }))} />
      </div>

      <Footer />
      {/* PLAN MODAL */}
      {activeModalPlan && (() => {
        const plans = [
          { id: '10K', title: '10K Plan', data: PLAN_10K, color: 'var(--orange)' },
          { id: 'HM_INT', title: 'Half Marathon (Int)', data: PLAN_HM_INT, color: 'var(--blue)' },
          { id: 'HM_BEG', title: 'Half Marathon (Beg)', data: PLAN_HM_BEG, color: 'var(--green)' }
        ]
        const plan = plans.find(p => p.id === activeModalPlan)
        if (!plan) return null
        
        return (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
            zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }} onClick={() => setActiveModalPlan(null)}>
            <div style={{
              background: 'var(--surface)', border: `1px solid ${plan.color}`, borderRadius: '12px',
              width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
              boxShadow: `0 0 40px rgba(0,0,0,0.5)`
            }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', margin: 0 }}>{plan.title}</h3>
                <button onClick={() => setActiveModalPlan(null)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ overflowY: 'auto', padding: '0' }}>
                <table className="plan-table" style={{ width: '100%' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 9 }}>
                    <tr><th style={{ padding: '16px 8px' }}>Wk</th><th>Tue</th><th>Thu</th><th>Sat</th><th>Sun</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {plan.data.map((w, i) => {
                      const isCurrent = i === currentWeekIdx();
                      const isPast = i < currentWeekIdx();
                      return (
                        <tr key={i} className={isCurrent ? 'current-week' : ''} style={{
                          background: isCurrent ? 'rgba(255,255,255,0.05)' : 'transparent',
                          opacity: isPast ? 0.4 : 1,
                          borderBottom: '1px solid var(--border)',
                          transition: 'background 0.2s'
                        }}>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: isCurrent ? plan.color : 'var(--muted)', padding: '14px 8px' }}>{w.wk}</td>
                          <td style={{ textAlign: 'center' }}>{w.tue}</td>
                          <td style={{ textAlign: 'center' }}>{w.thu}</td>
                          <td style={{ textAlign: 'center' }}>{w.sat}</td>
                          <td style={{ textAlign: 'center' }}>{w.sun}</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: isCurrent ? plan.color : 'var(--text)' }}>{w.total}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}
