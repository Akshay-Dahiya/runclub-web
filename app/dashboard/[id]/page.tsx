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
  const idOrSlug = resolvedParams.id
  
  // Try to find the user in the database first
  let dbUserRaw: any = null
  try {
    const queryPromise = prisma.user.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { email: idOrSlug }
        ]
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
    dbUserRaw = await Promise.race([queryPromise, timeoutPromise])
  } catch (error) {
    console.error('Prisma connection failed on dashboard query:', error)
  }

  let participantDef = null
  let dbUser = null

  if (dbUserRaw) {
    const staticPart = PARTICIPANTS.find(p => p.email === dbUserRaw.email)
    let cat: any = '10K'
    if (dbUserRaw.runningGoal) {
      if (dbUserRaw.runningGoal === '10.5K Run' || dbUserRaw.runningGoal === '10K') cat = '10K'
      else if (dbUserRaw.runningGoal === '21.1K Half Marathon' || dbUserRaw.runningGoal === 'HM' || dbUserRaw.runningGoal === 'HM_BEG') cat = 'HM_BEG'
      else if (dbUserRaw.runningGoal === 'HM_INT' || dbUserRaw.runningGoal === 'HM Intermediate') cat = 'HM_INT'
    } else if (staticPart) {
      cat = staticPart.cat
    }

    participantDef = {
      id: dbUserRaw.id,
      name: dbUserRaw.name || staticPart?.name || 'Unknown',
      initials: dbUserRaw.initials || staticPart?.initials || '??',
      email: dbUserRaw.email,
      cat
    }

    dbUser = {
      ...dbUserRaw,
      strava_athlete_id: dbUserRaw.strava_athlete_id ? dbUserRaw.strava_athlete_id.toString() : null,
      last_synced_at: dbUserRaw.last_synced_at ? dbUserRaw.last_synced_at.toISOString() : null,
      strava_token_expires_at: dbUserRaw.strava_token_expires_at ? dbUserRaw.strava_token_expires_at.toISOString() : null,
      createdAt: dbUserRaw.createdAt.toISOString(),
      updatedAt: dbUserRaw.updatedAt.toISOString(),
      runs: dbUserRaw.runs.map((r: any) => ({
        ...r,
        strava_activity_id: r.strava_activity_id ? r.strava_activity_id.toString() : null,
        date: r.date.toISOString(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))
    }
  } else {
    // If not found by CUID or email, check if it is a legacy numeric ID
    const numericId = parseInt(idOrSlug)
    if (!isNaN(numericId)) {
      const staticPart = PARTICIPANTS.find(p => p.id === numericId)
      if (staticPart) {
        const userEmail = staticPart.email || `placeholder_${numericId}@runclub.local`
        try {
          const queryPromise = prisma.user.upsert({
            where: { email: userEmail },
            update: {},
            create: {
              email: userEmail,
              name: staticPart.name,
              runningGoal: staticPart.cat.startsWith('HM') ? '21.1K Half Marathon' : '10.5K Run',
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
            participantDef = {
              id: dbUser.id,
              name: dbUser.name || staticPart.name,
              initials: dbUser.initials || staticPart.initials,
              email: dbUser.email,
              cat: staticPart.cat
            }
          }
        } catch (error) {
          console.error('Prisma connection failed on fallback upsert:', error)
        }

        if (!dbUser) {
          dbUser = {
            name: staticPart.name,
            runs: [],
            strava_connected: false,
            last_synced_at: null
          }
          participantDef = staticPart
        }
      }
    }
  }

  if (!participantDef || !dbUser) {
    redirect('/')
  }

  const updatedParticipantDef = participantDef


  const actualKm = dbUser.runs.reduce((sum: number, r: any) => sum + (r.distanceKm || 0), 0)
  const plannedKm = plannedKmSoFar(updatedParticipantDef as any)
  const status = getStatus(actualKm, updatedParticipantDef as any)
  const pct = plannedKm > 0 ? Math.min(100, Math.round((actualKm / plannedKm) * 100)) : 0
  const totalTarget = grandTotal(updatedParticipantDef as any)

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
          participantDef={updatedParticipantDef}
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
