import React from 'react'
import { prisma, hasDatabaseConfig } from '../lib/prisma'
import RunClubApp from '../components/RunClubApp'
import { PARTICIPANTS } from '../lib/planData'
import { getCurrentRunner } from '../lib/auth/runner'

export const dynamic = 'force-dynamic'

export default async function Home() {
  let users: any[] = []
  let viewerRunnerId: string | null = null

  if (hasDatabaseConfig()) {
    try {
      const dbUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          initials: true,
          runningGoal: true,
          runs: {
            orderBy: { date: 'desc' },
            select: {
              id: true,
              date: true,
              distanceKm: true,
              durationSec: true,
              paceSecPerKm: true,
            },
          },
        },
      })

      users = dbUsers.map((user: any) => {
        const email = user.email.toLowerCase()
        const participant = PARTICIPANTS.find(
          (entry) => entry.email?.toLowerCase() === email || `placeholder_${entry.id}@runclub.local` === email,
        )
        const goal = String(user.runningGoal || '').toLowerCase()
        const name = user.name || participant?.name || 'Runner'

        return {
          id: user.id,
          name,
          initials: user.initials || participant?.initials || name.split(' ').map((part: string) => part[0]).join('').toUpperCase(),
          category: participant?.cat || (goal.includes('half') || goal.includes('21') ? 'HM' : '10K'),
          runs: user.runs.map((run: any) => ({
            id: run.id,
            date: run.date.toISOString(),
            distanceKm: run.distanceKm,
            durationSec: run.durationSec,
            paceSecPerKm: run.paceSecPerKm,
          })),
        }
      })
    } catch (error) {
      console.error('Public runner data unavailable:', error)
    }

    try {
      viewerRunnerId = (await getCurrentRunner())?.id ?? null
    } catch (error) {
      console.error('Runner session unavailable on homepage:', error)
    }
  }

  return <RunClubApp users={users} viewerRunnerId={viewerRunnerId} />
}
