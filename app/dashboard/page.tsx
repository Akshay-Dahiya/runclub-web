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
    dbUser = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        runs: {
          orderBy: { date: 'desc' }
        }
      }
    })
  } catch (error) {
    console.error('Prisma connection failed on dashboard:', error)
  }

  if (!dbUser) {
    redirect('/login')
  }

  const participantDef = PARTICIPANTS.find(p => p.email === userEmail) || {
    id: 999, name: dbUser.name || 'Runner', initials: (dbUser.name || 'R').substring(0,2).toUpperCase(), email: userEmail, cat: (dbUser.runningGoal?.includes('Half') ? 'HM' : '10K') as 'HM' | '10K'
  }

  const actualKm = dbUser.runs.reduce((sum: number, r: any) => sum + r.distanceKm, 0)
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

        {/* PROFILE CARD */}
        <div className={`participant-card status-${status}`} style={{ maxWidth: '600px', marginBottom: '40px' }}>
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

        <PersonalLogRunForm email={userEmail} />

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
                  <tr><td colSpan={4} style={{ textAlign: 'center', opacity: 0.5 }}>No runs logged yet.</td></tr>
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
