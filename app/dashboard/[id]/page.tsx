import React from 'react'
import { prisma, hasDatabaseConfig } from '../../../lib/prisma'
import { PARTICIPANTS, plannedKmSoFar, getStatus, grandTotal } from '../../../lib/planData'
import DashboardClient from '../../../components/Dashboard/DashboardClient'
import { getCurrentRunner } from '../../../lib/auth/runner'
import { redirect } from 'next/navigation'
import Footer from '../../../components/Footer'

export const dynamic = 'force-dynamic'

function serializeRunner(user: any, isOwner: boolean) {
  return {
    id: user.id,
    name: user.name,
    initials: user.initials,
    runningGoal: user.runningGoal,
    strava_connected: isOwner ? user.strava_connected : false,
    strava_athlete_id: isOwner && user.strava_athlete_id ? user.strava_athlete_id.toString() : null,
    last_synced_at: isOwner && user.last_synced_at ? user.last_synced_at.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    runs: user.runs.map((run: any) => ({
      id: run.id,
      date: run.date.toISOString(),
      distanceKm: run.distanceKm,
      durationSec: run.durationSec,
      paceSecPerKm: run.paceSecPerKm,
      avgHeartRate: isOwner ? run.avgHeartRate : null,
      notes: isOwner ? run.notes : null,
      source: run.source,
      strava_activity_id: isOwner && run.strava_activity_id ? run.strava_activity_id.toString() : null,
      createdAt: run.createdAt.toISOString(),
      updatedAt: run.updatedAt.toISOString(),
    })),
  }
}

export default async function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const idOrSlug = resolvedParams.id
  let viewer: Awaited<ReturnType<typeof getCurrentRunner>> = null
  let dbUserRaw: any = null
  if (hasDatabaseConfig()) {
    try {
      viewer = await getCurrentRunner()
    } catch (error) {
      console.error('Runner session lookup failed on dashboard:', error)
    }

    try {
      const queryPromise = prisma.user.findFirst({
        where: {
          OR: [
            { id: idOrSlug },
            { email: idOrSlug },
          ],
        },
        select: {
          id: true,
          email: true,
          name: true,
          initials: true,
          runningGoal: true,
          strava_athlete_id: true,
          strava_connected: true,
          last_synced_at: true,
          createdAt: true,
          updatedAt: true,
          runs: {
            orderBy: { date: 'desc' },
            select: {
              id: true,
              date: true,
              distanceKm: true,
              durationSec: true,
              paceSecPerKm: true,
              avgHeartRate: true,
              notes: true,
              source: true,
              strava_activity_id: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      })
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Prisma connection timeout')), 8000),
      )
      dbUserRaw = await Promise.race([queryPromise, timeoutPromise])
    } catch (error) {
      console.error('Prisma connection failed on dashboard query:', error)
    }
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
      cat
    }

    dbUser = serializeRunner(dbUserRaw, viewer?.id === dbUserRaw.id)
  } else {
    // If not found by CUID or email, check if it is a legacy numeric ID
    const numericId = parseInt(idOrSlug)
    if (!isNaN(numericId)) {
      const staticPart = PARTICIPANTS.find(p => p.id === numericId)
      if (staticPart) {
        if (hasDatabaseConfig()) {
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
            select: {
              id: true,
              email: true,
              name: true,
              initials: true,
              runningGoal: true,
              strava_athlete_id: true,
              strava_connected: true,
              last_synced_at: true,
              createdAt: true,
              updatedAt: true,
              runs: {
                orderBy: { date: 'desc' },
                select: {
                  id: true,
                  date: true,
                  distanceKm: true,
                  durationSec: true,
                  paceSecPerKm: true,
                  avgHeartRate: true,
                  notes: true,
                  source: true,
                  strava_activity_id: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            }
          })
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Prisma connection timeout')), 8000)
          )
          const queryResult: any = await Promise.race([queryPromise, timeoutPromise])
          if (queryResult) {
            dbUser = serializeRunner(queryResult, viewer?.id === queryResult.id)
            participantDef = {
              id: dbUser.id,
              name: dbUser.name || staticPart.name,
              initials: dbUser.initials || staticPart.initials,
              cat: staticPart.cat
            }
          }
          } catch (error) {
            console.error('Prisma connection failed on fallback upsert:', error)
          }
        }

        if (!dbUser) {
          const fallbackTime = new Date().toISOString()
          dbUser = {
            id: String(staticPart.id),
            name: staticPart.name,
            initials: staticPart.initials,
            runningGoal: staticPart.cat.startsWith('HM') ? '21.1K Half Marathon' : '10.5K Run',
            runs: [],
            strava_connected: false,
            strava_athlete_id: null,
            last_synced_at: null,
            createdAt: fallbackTime,
            updatedAt: fallbackTime,
          }
          participantDef = staticPart
        }
      }
    }
  }

  if (!participantDef || !dbUser) {
    redirect('/')
  }

  const isOwner = Boolean(viewer && dbUser?.id && viewer.id === dbUser.id)
  const updatedParticipantDef = participantDef
  const safeParticipantDef = {
    id: updatedParticipantDef.id,
    name: updatedParticipantDef.name,
    initials: updatedParticipantDef.initials,
    cat: updatedParticipantDef.cat,
  }

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
          participantDef={safeParticipantDef}
          actualKm={actualKm}
          isOwner={isOwner}
          viewerRunnerName={viewer?.name ?? null}
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
