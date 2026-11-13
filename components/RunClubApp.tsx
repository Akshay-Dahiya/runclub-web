"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from './Navbar'
import Hero from './Hero'
import Footer from './Footer'
import ActivityFeed from './ActivityFeed'
import ClubStories from './ClubStories'
import ClubProgressBar from './ClubProgressBar'
import InclusiveSection from './InclusiveSection'
import PerformanceCharts from './PerformanceCharts'
import { getStatus, grandTotal } from '../lib/planData'

function DashboardPicker({ runners }: { runners: any[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState('')
  return (
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '540px', margin: '0 auto' }}>
      <select
        value={selected}
        onChange={e => setSelected(e.target.value)}
        style={{
          flex: 1, minWidth: '220px',
          background: '#FFFFFF', color: '#0F172A',
          border: '1.5px solid #CBD5E1', borderRadius: '12px',
          padding: '14px 18px', fontSize: '0.95rem', cursor: 'pointer', outline: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}
      >
        <option value="">Select your runner profile...</option>
        {runners.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <button
        onClick={() => { if (selected) router.push(`/dashboard/${selected}`) }}
        disabled={!selected}
        style={{
          background: selected ? '#FC4C02' : '#E2E8F0',
          color: selected ? '#FFFFFF' : '#94A3B8',
          border: 'none', borderRadius: '12px',
          padding: '14px 28px', fontSize: '0.95rem', fontWeight: 800,
          cursor: selected ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s', whiteSpace: 'nowrap',
          boxShadow: selected ? '0 4px 14px rgba(252,76,2,0.3)' : 'none'
        }}
      >
        Open Dashboard →
      </button>
    </div>
  )
}

function WhoRanToday() {
  const [runners, setRunners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    fetch('/api/who-ran-today')
      .then(r => r.json())
      .then(d => { setRunners(d.runners || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading || runners.length === 0) return null

  return (
    <div style={{
      background: '#FFF7ED',
      borderBottom: '1px solid #FFEDD5',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      flexWrap: 'wrap'
    }}>
      <span style={{ fontSize: '13px', fontWeight: 700, color: '#C2410C' }}>
        🔥 Active Today:
      </span>
      {runners.map(r => (
        <span key={r.id} style={{
          background: '#FFFFFF',
          border: '1px solid #FED7AA',
          borderRadius: '20px',
          padding: '3px 12px',
          fontSize: '12px',
          color: '#0F172A',
          fontWeight: 600,
          boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
        }}>
          {r.name} ({r.distanceKm} km)
        </span>
      ))}
    </div>
  )
}

export default function RunClubApp({ users, viewerRunnerId = null }: { users: any[]; viewerRunnerId?: string | null }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [leaderboardTab, setLeaderboardTab] = useState<'weekly' | 'overall'>('weekly')

  const mappedUsers = users.map((user: any) => {
    const name = user.name || 'Runner'
    const initials = user.initials || name.split(' ').map((part: string) => part[0]).join('').toUpperCase()
    const runs = user.runs || []
    const actualKm = runs.reduce((sum: number, run: any) => sum + (run.distanceKm || 0), 0)

    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const weekRuns = runs.filter((run: any) => new Date(run.date) >= startOfWeek)
    const weekKm = weekRuns.reduce((sum: number, run: any) => sum + (run.distanceKm || 0), 0)
    const participant = { id: user.id, email: '', name, initials, cat: user.category || '10K' }
    const status = getStatus(actualKm, participant)

    return {
      id: user.id,
      name,
      initials,
      runs,
      actualKm,
      weekKm,
      status,
      totalTarget: grandTotal(participant),
    }
  })

  const totalRuns = mappedUsers.reduce((sum, u) => sum + u.runs.length, 0)
  const totalKm = mappedUsers.reduce((sum, u) => sum + u.actualKm, 0)
  const thisWeekTotalKm = mappedUsers.reduce((sum, u) => sum + u.weekKm, 0)

  const sortedUsers = [...mappedUsers].sort((a, b) => {
    return leaderboardTab === 'weekly' ? b.weekKm - a.weekKm : b.actualKm - a.actualKm
  })

  const [activeDashboardId, setActiveDashboardId] = useState('')
  const currentDashboardRunner = mappedUsers.find(u => u.id === activeDashboardId)

  return (
    <>
      <Navbar />
      
      {/* HERO SECTION */}
      <Hero
        thisWeekKm={thisWeekTotalKm}
        activeRunnersCount={mappedUsers.length}
      />

      {/* WHO RAN TODAY TICKER */}
      <WhoRanToday />

      {/* ── 00. RUNNER DASHBOARD (OPEN FIRST) ── */}
      <div id="dashboard" style={{ background: '#F8FAFC', padding: '60px 24px 70px', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <div>
              <span className="section-tag">// Runner Hub</span>
              <h2 className="section-title" style={{ marginBottom: '4px' }}>
                Runner Performance
              </h2>
              <p className="section-sub" style={{ margin: 0 }}>
                Weekly mileage and training trends at a glance.
              </p>
            </div>

            {/* Runner Selector & Direct Dashboard Link */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <select
                value={activeDashboardId}
                disabled={mappedUsers.length === 0}
                onChange={e => setActiveDashboardId(e.target.value)}
                style={{
                  background: '#FFFFFF',
                  color: '#0F172A',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                {mappedUsers.length === 0 ? (
                  <option value="">No runner data available</option>
                ) : (
                  <>
                    <option value="">Choose a runner profile...</option>
                    {mappedUsers.map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </>
                )}
              </select>

              {currentDashboardRunner && (
                <Link
                  href={`/dashboard/${currentDashboardRunner.id}`}
                  style={{
                    background: '#FFFFFF',
                    color: '#FC4C02',
                    border: '1.5px solid #FC4C02',
                    borderRadius: '12px',
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(252,76,2,0.1)'
                  }}
                >
                  Full View →
                </Link>
              )}
            </div>
          </div>

          {!currentDashboardRunner && mappedUsers.length > 0 && (
            <p role="status" style={{ margin: '0 0 24px', color: '#64748B', fontSize: '14px' }}>
              Choose a runner profile to view their progress.
            </p>
          )}

          {/* Active Runner Overview Cards */}
          {currentDashboardRunner && (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '28px'
              }}>
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Runner
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>
                    {currentDashboardRunner.name}
                  </div>
                </div>

                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    This Week
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#FC4C02', marginTop: '4px' }}>
                    {currentDashboardRunner.weekKm.toFixed(1)} km
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    Logged in the last 7 days
                  </div>
                </div>

                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    All-Time Distance
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>
                    {currentDashboardRunner.actualKm.toFixed(1)} km
                  </div>
                  <div style={{ fontSize: '12px', color: '#16A34A', fontWeight: 700, marginTop: '2px' }}>
                    Active & Consistency
                  </div>
                </div>
              </div>

              <PerformanceCharts runs={currentDashboardRunner.runs || []} />
            </div>
          )}
        </div>
      </div>

      {/* ── 02. INCLUSIVE PHILOSOPHY (SLOW TO GET FAST) ── */}
      <div className="section" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <InclusiveSection />
      </div>

      <hr className="divider" />

      {/* ── 03. LIVE COMMUNITY FEED ── */}
      <div className="section" id="feed" style={{ paddingTop: '80px', paddingBottom: '60px' }}>
        <div>
          <span className="section-tag">// Community Pulse</span>
          <h2 className="section-title">Live Activity Feed</h2>
          <p className="section-sub">
            Real runs synced automatically from Strava. Drop high-fives and hype up fellow runners.
          </p>
        </div>
        <div style={{ marginTop: '24px' }}>
          <ActivityFeed isSignedIn={Boolean(viewerRunnerId)} />
        </div>
      </div>

      <hr className="divider" />

      {/* ── 04. COLLECTIVE COMMUNITY PROGRESS & LEADERBOARD ── */}
      <div className="section" id="leaderboard" style={{ paddingTop: '80px' }}>
        <ClubProgressBar
          totalKm={totalKm}
          totalTarget={3000}
          totalRuns={totalRuns}
          activeRunners={mappedUsers.length}
        />

        {/* Leaderboard Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <span className="section-tag">// Friendly Rankings</span>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Community Leaderboard</h2>
          </div>

          <div style={{ display: 'flex', gap: '8px', background: '#F1F5F9', padding: '4px', borderRadius: '12px' }}>
            <button
              onClick={() => setLeaderboardTab('weekly')}
              style={{
                background: leaderboardTab === 'weekly' ? '#FFFFFF' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 18px',
                fontSize: '12px',
                fontWeight: 700,
                color: leaderboardTab === 'weekly' ? '#FC4C02' : '#64748B',
                cursor: 'pointer',
                boxShadow: leaderboardTab === 'weekly' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              This Week
            </button>
            <button
              onClick={() => setLeaderboardTab('overall')}
              style={{
                background: leaderboardTab === 'overall' ? '#FFFFFF' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 18px',
                fontSize: '12px',
                fontWeight: 700,
                color: leaderboardTab === 'overall' ? '#FC4C02' : '#64748B',
                cursor: 'pointer',
                boxShadow: leaderboardTab === 'overall' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Leaderboard Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sortedUsers.map((u, rank) => {
            const distance = leaderboardTab === 'weekly' ? u.weekKm : u.actualKm
            return (
              <div
                key={u.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '16px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'transform 0.15s, border-color 0.15s'
                }}
              >
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '1.6rem',
                  color: rank === 0 ? '#F59E0B' : rank === 1 ? '#94A3B8' : rank === 2 ? '#B45309' : '#CBD5E1',
                  minWidth: '28px',
                  lineHeight: 1
                }}>
                  #{rank + 1}
                </div>

                <Link href={`/dashboard/${u.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    background: rank === 0 ? '#FEF3C7' : '#F1F5F9',
                    color: rank === 0 ? '#D97706' : '#0F172A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '12px', fontFamily: 'monospace'
                  }}>
                    {u.initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: '#0F172A' }}>
                      {u.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      {u.runs.length} runs recorded
                    </div>
                  </div>
                </Link>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FC4C02', lineHeight: 1 }}>
                    {distance.toFixed(1)}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#64748B' }}>KM</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <hr className="divider" style={{ marginTop: '80px' }} />

      {/* ── 05. PERSONAL RUNNER DASHBOARD SELECTOR ── */}
      <div id="dashboard" style={{ background: '#F8FAFC', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <span className="section-tag">// Your Private Hub</span>
          <h2 className="section-title">Open Your Personal Dashboard</h2>
          <p className="section-sub" style={{ margin: '0 auto 32px auto' }}>
            Connect Strava and review your training history and performance charts.
          </p>

          <DashboardPicker runners={mappedUsers} />

          <div style={{ marginTop: '36px', fontSize: '13px', color: '#64748B' }}>
            New to RunClub? <Link href="/signup" style={{ color: '#FC4C02', fontWeight: 700, textDecoration: 'none' }}>Join with Strava</Link> and your runner profile will be created automatically.
          </div>
        </div>
      </div>

      <ClubStories viewerRunnerId={viewerRunnerId} variant="preview" />

      <Footer />
    </>
  )
}
