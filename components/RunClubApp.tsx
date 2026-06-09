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
    return { ...p, dbUser, runs, actualKm, weekKm, status, totalTarget }
  }).sort((a, b) => b.actualKm - a.actualKm)
  
  const weeklyTopUsers = [...mappedUsers].sort((a, b) => b.weekKm - a.weekKm)

  let filteredUsers = mappedUsers
  if (activeFilter === 'HM_INT') filteredUsers = mappedUsers.filter(u => u.cat === 'HM_INT')
  if (activeFilter === 'HM_BEG') filteredUsers = mappedUsers.filter(u => u.cat === 'HM_BEG')
  if (activeFilter === '10K') filteredUsers = mappedUsers.filter(u => u.cat === '10K')
  if (activeFilter === 'green') filteredUsers = mappedUsers.filter(u => u.status === 'green')
  if (activeFilter === 'red') filteredUsers = mappedUsers.filter(u => u.status === 'red')

  const totalRuns = mappedUsers.reduce((sum, u) => sum + u.runs.length, 0)
  const totalKm = mappedUsers.reduce((sum, u) => sum + u.actualKm, 0)
  const weeksLeft = Math.max(0, Math.ceil((new Date('2026-08-23').getTime() - new Date().getTime()) / (7 * 86400000)))

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
                  <span className={`p-badge badge-${u.status}`}>
                    {u.status === 'green' ? '✓ On Track' : u.status === 'yellow' ? '~ Close' : '✕ Behind'}
                  </span>
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
          <p className="section-sub">10 weeks of structured training. Tue · Thu · Sat · Sun. Every run counts.</p>
        </div>
        <div className="plan-wrap reveal visible">
          <div className="plan-table-container" style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '10px', scrollBehavior: 'smooth' }}>
            <div className="plan-table-header" style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10, paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <div className="plan-title" style={{ fontSize: '1.4rem' }}>10K Plan</div>
              <span className="p-category cat-10k">10.5K</span>
            </div>
            <table className="plan-table" style={{ width: '100%', marginTop: '10px' }}>
              <thead style={{ position: 'sticky', top: '56px', background: 'var(--surface)', zIndex: 9 }}>
                <tr><th style={{ padding: '16px 8px' }}>Week</th><th>Tue</th><th>Thu</th><th>Sat</th><th>Sun</th><th>Total</th></tr>
              </thead>
              <tbody>
                {PLAN_10K.map((w, i) => {
                  const isCurrent = i === currentWeekIdx()
                  return (
                  <tr key={i} className={isCurrent ? 'current-week' : ''} style={{
                    height: '64px', fontSize: '1.05rem',
                    background: isCurrent ? 'rgba(252,76,2,0.1)' : 'transparent',
                    boxShadow: isCurrent ? 'inset 4px 0 0 var(--accent)' : 'none',
                    transition: 'background 0.2s'
                  }}>
                    <td style={{ fontWeight: isCurrent ? 700 : 400 }}>{w.label}</td>
                    <td className="km-cell">{w.tue}</td>
                    <td className="km-cell">{w.thu}</td>
                    <td className="km-cell">{w.sat}</td>
                    <td className="km-cell">{w.sun}</td>
                    <td className="km-cell" style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.1rem' }}>{w.total}</td>
                  </tr>
                )})}
                <tr className="total-row" style={{ height: '64px' }}><td style={{ fontWeight: 800 }}>TOTAL</td><td colSpan={4}></td><td style={{ fontWeight: 800 }}>239 km</td></tr>
              </tbody>
            </table>
          </div>

          <div className="plan-table-container" style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '10px', scrollBehavior: 'smooth' }}>
            <div className="plan-table-header" style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10, paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <div className="plan-title" style={{ fontSize: '1.4rem' }}>Half Marathon Plan (Int)</div>
              <span className="p-category cat-hm">21.1K</span>
            </div>
            <table className="plan-table" style={{ width: '100%', marginTop: '10px' }}>
              <thead style={{ position: 'sticky', top: '56px', background: 'var(--surface)', zIndex: 9 }}>
                <tr><th style={{ padding: '16px 8px' }}>Week</th><th>Tue</th><th>Thu</th><th>Sat</th><th>Sun</th><th>Total</th></tr>
              </thead>
              <tbody>
                {PLAN_HM_INT.map((w, i) => {
                  const isCurrent = i === currentWeekIdx()
                  return (
                  <tr key={i} className={isCurrent ? 'current-week' : ''} style={{
                    height: '64px', fontSize: '1.05rem',
                    background: isCurrent ? 'rgba(34,211,238,0.1)' : 'transparent',
                    boxShadow: isCurrent ? 'inset 4px 0 0 var(--blue)' : 'none',
                    transition: 'background 0.2s'
                  }}>
                    <td style={{ fontWeight: isCurrent ? 700 : 400 }}>{w.label}</td>
                    <td className="km-cell">{w.tue}</td>
                    <td className="km-cell">{w.thu}</td>
                    <td className="km-cell">{w.sat}</td>
                    <td className="km-cell">{w.sun}</td>
                    <td className="km-cell" style={{ color: 'var(--blue)', fontWeight: 700, fontSize: '1.1rem' }}>{w.total}</td>
                  </tr>
                )})}
                <tr className="total-row" style={{ height: '64px' }}><td style={{ fontWeight: 800 }}>TOTAL</td><td colSpan={4}></td><td style={{ fontWeight: 800 }}>368 km</td></tr>
              </tbody>
            </table>
          </div>

          <div className="plan-table-container" style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '10px', scrollBehavior: 'smooth' }}>
            <div className="plan-table-header" style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10, paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <div className="plan-title" style={{ fontSize: '1.4rem' }}>Half Marathon Plan (Beg)</div>
              <span className="p-category cat-hm">21.1K</span>
            </div>
            <table className="plan-table" style={{ width: '100%', marginTop: '10px' }}>
              <thead style={{ position: 'sticky', top: '56px', background: 'var(--surface)', zIndex: 9 }}>
                <tr><th style={{ padding: '16px 8px' }}>Week</th><th>Tue</th><th>Thu</th><th>Sat</th><th>Sun</th><th>Total</th></tr>
              </thead>
              <tbody>
                {PLAN_HM_BEG.map((w, i) => {
                  const isCurrent = i === currentWeekIdx()
                  return (
                  <tr key={i} className={isCurrent ? 'current-week' : ''} style={{
                    height: '64px', fontSize: '1.05rem',
                    background: isCurrent ? 'rgba(34,211,238,0.1)' : 'transparent',
                    boxShadow: isCurrent ? 'inset 4px 0 0 var(--blue)' : 'none',
                    transition: 'background 0.2s'
                  }}>
                    <td style={{ fontWeight: isCurrent ? 700 : 400 }}>{w.label}</td>
                    <td className="km-cell">{w.tue}</td>
                    <td className="km-cell">{w.thu}</td>
                    <td className="km-cell">{w.sat}</td>
                    <td className="km-cell">{w.sun}</td>
                    <td className="km-cell" style={{ color: 'var(--blue)', fontWeight: 700, fontSize: '1.1rem' }}>{w.total}</td>
                  </tr>
                )})}
                <tr className="total-row" style={{ height: '64px' }}><td style={{ fontWeight: 800 }}>TOTAL</td><td colSpan={4}></td><td style={{ fontWeight: 800 }}>340 km</td></tr>
              </tbody>
            </table>
          </div>
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
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button className={`tab-btn ${leaderboardTab === 'overall' ? 'active' : ''}`} onClick={() => setLeaderboardTab('overall')}>Overall</button>
          <button className={`tab-btn ${leaderboardTab === 'weekly' ? 'active' : ''}`} onClick={() => setLeaderboardTab('weekly')}>This Week</button>
        </div>

        <div className="lb-grid">
          
          {/* OVERALL LEADERBOARD */}
          {leaderboardTab === 'overall' && (
          <div className="table-responsive reveal visible">
            <table className="lb-table">
              <thead>
                <tr>
                  <th>#</th><th>Runner</th><th>KM Done</th><th>Completion</th>
                </tr>
              </thead>
              <tbody>
                {mappedUsers.map((u, i) => {
                  const planned = plannedKmSoFar(u)
                  const pct = planned > 0 ? Math.min(100, Math.round((u.actualKm / planned) * 100)) : 0
                  return (
                    <tr key={u.id}>
                      <td><span className={`rank-num ${i < 3 ? 'top3' : ''}`}>{i + 1}</span></td>
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
                      <td><span className="lb-km">{u.actualKm.toFixed(2)} km</span></td>
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
              </tbody>
            </table>
          </div>
          )}

          {/* WEEKLY LEADERBOARD */}
          {leaderboardTab === 'weekly' && (
          <div className="table-responsive reveal visible">
            <table className="lb-table">
              <thead>
                <tr>
                  <th>#</th><th>Runner</th><th>KM This Week</th><th>Week Target</th>
                </tr>
              </thead>
              <tbody>
                {weeklyTopUsers.map((u, i) => {
                  const weekTarget = getPlan(u)[Math.min(currentWeekIdx(), 9)]?.total || 0
                  const pct = weekTarget > 0 ? Math.min(100, Math.round((u.weekKm / weekTarget) * 100)) : 0
                  return (
                    <tr key={u.id}>
                      <td><span className={`rank-num ${i < 3 ? 'top3' : ''}`}>{i + 1}</span></td>
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
                      <td><span className="lb-km" style={{ color: 'var(--blue)' }}>{u.weekKm.toFixed(2)} km</span></td>
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
              </tbody>
            </table>
          </div>
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
    </>
  )
}
