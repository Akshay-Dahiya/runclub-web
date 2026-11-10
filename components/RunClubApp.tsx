"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from './Navbar'
import Hero from './Hero'
import Footer from './Footer'
import ActivityFeed from './ActivityFeed'
import ClubProgressBar from './ClubProgressBar'
import InteractiveGoalPicker from './InteractiveGoalPicker'
import InclusiveSection from './InclusiveSection'
import PerformanceCharts from './PerformanceCharts'
import MicroGoalsWidget from './MicroGoalsWidget'
import { PARTICIPANTS, getStatus, grandTotal } from '../lib/planData'

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

export default function RunClubApp({ users }: { users: any[] }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [leaderboardTab, setLeaderboardTab] = useState<'weekly' | 'overall'>('weekly')

  // Map users with DB stats
  const mappedUsers = users.map(u => {
    const staticPart = PARTICIPANTS.find(p => p.email === u.email)
    const name = u.name || staticPart?.name || 'Runner'
    const initials = u.initials || staticPart?.initials || name.split(' ').map((w: string) => w[0]).join('').toUpperCase()
    const runs = u.runs || []
    const actualKm = runs.reduce((sum: number, r: any) => sum + (r.distanceKm || 0), 0)

    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0,0,0,0)

    const weekRuns = runs.filter((r: any) => new Date(r.date) >= startOfWeek)
    const weekKm = weekRuns.reduce((sum: number, r: any) => sum + (r.distanceKm || 0), 0)
    const fallbackParticipant: any = { id: 1, name, initials, cat: '10K' as const }
    const status = getStatus(actualKm, staticPart || fallbackParticipant)

    return {
      id: u.id,
      name,
      initials,
      email: u.email,
      runs,
      actualKm,
      weekKm,
      status,
      totalTarget: grandTotal(staticPart || fallbackParticipant)
    }
  })

  const totalRuns = mappedUsers.reduce((sum, u) => sum + u.runs.length, 0)
  const totalKm = mappedUsers.reduce((sum, u) => sum + u.actualKm, 0)
  const thisWeekTotalKm = mappedUsers.reduce((sum, u) => sum + u.weekKm, 0)

  const sortedUsers = [...mappedUsers].sort((a, b) => {
    return leaderboardTab === 'weekly' ? b.weekKm - a.weekKm : b.actualKm - a.actualKm
  })

  // Selected runner for top dashboard view (defaults to first runner with runs or connected)
  const defaultRunnerId = mappedUsers.find(u => u.runs && u.runs.length > 0)?.id || mappedUsers[0]?.id || ''
  const [activeDashboardId, setActiveDashboardId] = useState<string>(defaultRunnerId)
  
  useEffect(() => {
    if (!activeDashboardId && mappedUsers.length > 0) {
      const active = mappedUsers.find(u => u.runs && u.runs.length > 0) || mappedUsers[0]
      if (active) setActiveDashboardId(active.id)
    }
  }, [mappedUsers, activeDashboardId])

  const currentDashboardRunner = mappedUsers.find(u => u.id === activeDashboardId) || mappedUsers[0]

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
                Performance & Micro-Goals
              </h2>
              <p className="section-sub" style={{ margin: 0 }}>
                Live metrics, 8-week volume trends, and achievable weekly targets.
              </p>
            </div>

            {/* Runner Selector & Direct Dashboard Link */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <select
                value={activeDashboardId}
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
                {mappedUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    👤 {u.name} ({u.runs?.length || 0} runs)
                  </option>
                ))}
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
                  <div style={{ fontSize: '12px', color: '#FC4C02', fontWeight: 700, marginTop: '2px' }}>
                    {currentDashboardRunner.runs?.length || 0} Total Activities Synced
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

              {/* Performance Charts & Micro-Goals */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <PerformanceCharts runs={currentDashboardRunner.runs || []} />
                <MicroGoalsWidget runs={currentDashboardRunner.runs || []} userId={currentDashboardRunner.id} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 01. INTERACTIVE GOAL PICKER (BITE-SIZED ACHIEVABLE GOALS) ── */}
      <div className="section" id="goals" style={{ paddingTop: '60px', paddingBottom: '40px' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 32px auto' }}>
          <span className="section-tag">// Step 1 · Set Your Focus</span>
          <h2 className="section-title">What Kind of Runner Are You Today?</h2>
          <p className="section-sub" style={{ margin: '0 auto' }}>
            Pick a focus below. RunClub will build 3 small, achievable weekly goals around your actual Strava miles.
          </p>
        </div>

        <InteractiveGoalPicker />
      </div>

      <hr className="divider" />

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
          <ActivityFeed />
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
            Connect Strava, track your performance charts, and review your weekly micro-goals.
          </p>

          <DashboardPicker runners={mappedUsers} />

          <div style={{ marginTop: '36px', fontSize: '13px', color: '#64748B' }}>
            New runner? Just click <a href="/api/strava" style={{ color: '#FC4C02', fontWeight: 700, textDecoration: 'none' }}>Connect with Strava</a> to create your profile in 1 click.
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
