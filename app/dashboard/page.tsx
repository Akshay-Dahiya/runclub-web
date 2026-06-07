import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '../../lib/prisma'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import PersonalLogRunForm from '../../components/PersonalLogRunForm'
import { PARTICIPANTS, plannedKmSoFar, getStatus, grandTotal } from '../../lib/planData'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    redirect('/login')
  }

  const userEmail = session.user.email
  
  let dbUser = null
  try {
    const queryPromise = prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        runs: {
          orderBy: { date: 'desc' }
        }
      }
    })
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Prisma connection timeout')), 2000)
    )
    dbUser = await Promise.race([queryPromise, timeoutPromise])
  } catch (error) {
    console.error('Prisma connection failed on dashboard:', error)
  }

  if (!dbUser) {
    // Emergency Fallback: If DB times out, create a fake user so they don't get kicked out!
    dbUser = {
      name: session.user.name || 'Runner',
      runs: []
    }
  }

  const participantDef = PARTICIPANTS.find(p => p.email === userEmail) || {
    id: 999, name: dbUser.name || 'Runner', initials: (dbUser.name || 'R').substring(0,2).toUpperCase(), email: userEmail, cat: (dbUser.runningGoal?.includes('Half') ? 'HM' : '10K') as 'HM' | '10K'
  }

  const actualKm = dbUser.runs.reduce((sum: number, r: any) => sum + (r.distanceKm || 0), 0)
  const plannedKm = plannedKmSoFar(participantDef as any)
  const status = getStatus(actualKm, participantDef as any)
  const pct = plannedKm > 0 ? Math.min(100, Math.round((actualKm / plannedKm) * 100)) : 0
  const totalTarget = grandTotal(participantDef as any)

  return (
    <>
      <Navbar />
      <div className="section" style={{ minHeight: '80vh', paddingTop: '100px' }}>
        <div className="reveal visible">
          <span className="section-tag">// Dashboard</span>
          <h2 className="section-title">Welcome, {dbUser.name}</h2>
          <p className="section-sub">Your personal training hub. Log your runs and track your progress.</p>
        </div>

        {/* STRAVA CONNECT UI */}
        <div style={{ background: '#fc4c0215', border: '1px solid #fc4c02', padding: '16px', borderRadius: '8px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#fc4c02' }}>Connect Strava</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>Automatically sync your runs and get advanced pace charts.</p>
          </div>
          <button className="btn-primary" style={{ background: '#fc4c02', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Connect with Strava
          </button>
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {/* PROFILE CARD */}
          <div className={`participant-card status-${status}`} style={{ flex: '1 1 300px', minWidth: '300px' }}>
            <div className="p-header">
              <div className={`p-avatar av-${status}`}>{participantDef.initials}</div>
              <span className={`p-badge badge-${status}`}>
                {status === 'green' ? '✓ On Track' : status === 'yellow' ? '~ Close' : '✕ Behind'}
              </span>
            </div>
            <div className="p-name">{dbUser.name}</div>
            <span className={`p-category ${participantDef.cat === 'HM' ? 'cat-hm' : 'cat-10k'}`} style={{ display: 'inline-block', marginBottom: '16px' }}>
              {participantDef.cat === 'HM' ? '21.1K Half Marathon' : '10.5K Run'}
            </span>
            
            <div className="p-totals">
              <div className="p-total-item"><div className="p-total-num">{actualKm.toFixed(1)}</div><div className="p-total-lbl">KM Done</div></div>
              <div className="p-total-item"><div className="p-total-num">{plannedKm.toFixed(0)}</div><div className="p-total-lbl">KM Due</div></div>
              <div className="p-total-item"><div className="p-total-num">{pct}%</div><div className="p-total-lbl">On Plan</div></div>
              <div className="p-total-item"><div className="p-total-num">{totalTarget}</div><div className="p-total-lbl">Total Target</div></div>
            </div>
          </div>

          {/* WEEKLY CHART PLACEHOLDER */}
          <div style={{ flex: '2 1 400px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', fontFamily: "'Bebas Neue', sans-serif" }}>Weekly Mileage Chart</h3>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '8px', minHeight: '150px', borderBottom: '1px solid var(--border)' }}>
              {/* CSS Bar Chart */}
              {[15, 30, 45, 20, 60, 40, 80].map((h, i) => (
                <div key={i} style={{ flex: 1, background: 'var(--green)', height: `${h}%`, minHeight: '4px', borderRadius: '4px 4px 0 0', opacity: i === 6 ? 1 : 0.5 }}></div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.8rem', opacity: 0.6 }}>
              <span>Wk 1</span>
              <span>Wk 2</span>
              <span>Wk 3</span>
              <span>Wk 4</span>
              <span>Wk 5</span>
              <span>Wk 6</span>
              <span>Wk 7</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '40px' }}>
          <PersonalLogRunForm email={userEmail} />
        </div>

        {/* RUN HISTORY */}
        <div style={{ marginTop: '40px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', fontFamily: "'Bebas Neue', sans-serif" }}>Your Run History</h3>
          <div className="table-responsive">
            <table className="lb-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Distance</th>
                  <th>Pace</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {dbUser.runs.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', opacity: 0.5 }}>No runs logged yet (or DB connection failed).</td></tr>
                ) : (
                  dbUser.runs.map((r: any) => {
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
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
