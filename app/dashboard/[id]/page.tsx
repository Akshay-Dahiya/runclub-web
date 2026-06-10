import React from 'react'
import { prisma } from '../../../lib/prisma'
import { PARTICIPANTS, plannedKmSoFar, getStatus, grandTotal } from '../../../lib/planData'
import DashboardClient from '../../../components/Dashboard/DashboardClient'
import { redirect } from 'next/navigation'
import Navbar from '../../../components/Navbar'
import Footer from '../../../components/Footer'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const participantId = parseInt(resolvedParams.id)
  const participantDef = PARTICIPANTS.find(p => p.id === participantId)

  if (!participantDef) {
    redirect('/')
  }

  const userEmail = participantDef.email || `placeholder_${participantId}@runclub.local`
  
  let dbUser = null
  try {
    const queryPromise = prisma.user.upsert({
      where: { email: userEmail },
      update: {},
      create: {
        email: userEmail,
        name: participantDef.name,
        runningGoal: participantDef.cat.startsWith('HM') ? '21.1K Half Marathon' : '10.5K Run',
      },
      include: {
        runs: {
          orderBy: { date: 'desc' }
        }
      }
    })
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Prisma connection timeout')), 8000)
    )
    const queryResult: any = await Promise.race([queryPromise, timeoutPromise])
    if (queryResult) {
      dbUser = {
        ...queryResult,
        strava_athlete_id: queryResult.strava_athlete_id ? queryResult.strava_athlete_id.toString() : null,
        last_synced_at: queryResult.last_synced_at ? queryResult.last_synced_at.toISOString() : null,
        strava_token_expires_at: queryResult.strava_token_expires_at ? queryResult.strava_token_expires_at.toISOString() : null,
        createdAt: queryResult.createdAt.toISOString(),
        updatedAt: queryResult.updatedAt.toISOString(),
        runs: queryResult.runs.map((r: any) => ({
          ...r,
          strava_activity_id: r.strava_activity_id ? r.strava_activity_id.toString() : null,
          date: r.date.toISOString(),
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }))
      }
    }
  } catch (error) {
    console.error('Prisma connection failed on dashboard:', error)
  }

  if (!dbUser) {
    // Emergency Fallback: If DB times out, create a fake user so they don't get kicked out!
    dbUser = {
      name: participantDef.name,
      runs: [],
      strava_connected: false,
      last_synced_at: null
    }
  }

  const actualKm = dbUser.runs.reduce((sum: number, r: any) => sum + (r.distanceKm || 0), 0)
  const plannedKm = plannedKmSoFar(participantDef as any)
  const status = getStatus(actualKm, participantDef as any)
  const pct = plannedKm > 0 ? Math.min(100, Math.round((actualKm / plannedKm) * 100)) : 0
  const totalTarget = grandTotal(participantDef as any)

  return (
    <>
      <div style={{ padding: '24px 40px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <a href="/" style={{ 
          display: 'inline-block', color: 'var(--muted)', textDecoration: 'none', 
          fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase' 
        }}>← Back to Home</a>
      </div>
      <div className="section" style={{ minHeight: '80vh', paddingTop: '60px' }}>
        <DashboardClient 
          dbUser={dbUser}
          participantDef={participantDef}
          actualKm={actualKm}
          plannedKm={plannedKm}
          status={status}
          pct={pct}
          totalTarget={totalTarget}
        />
      </div>
      <Footer />
    </>
  )
}
