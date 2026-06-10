import React from 'react'
import { prisma } from '../lib/prisma'
import RunClubApp from '../components/RunClubApp'
import Navbar from '../components/Navbar'

export const dynamic = 'force-dynamic'

export default async function Home() {
  let users: any[] = []
  try {
    const dbUsers = await prisma.user.findMany({
      include: {
        runs: {
          orderBy: { date: 'desc' }
        }
      }
    })
    users = dbUsers.map((u: any) => ({
      ...u,
      strava_athlete_id: u.strava_athlete_id ? u.strava_athlete_id.toString() : null,
      last_synced_at: u.last_synced_at ? u.last_synced_at.toISOString() : null,
      strava_token_expires_at: u.strava_token_expires_at ? u.strava_token_expires_at.toISOString() : null,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      runs: u.runs.map((r: any) => ({
        ...r,
        strava_activity_id: r.strava_activity_id ? r.strava_activity_id.toString() : null,
        date: r.date.toISOString(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))
    }))
  } catch (error) {
    console.error('Prisma connection failed on homepage:', error)
    // Fallback to empty users list if DB is not connected
  }

  return <RunClubApp users={users} />
}