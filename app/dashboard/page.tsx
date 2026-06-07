import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '../../lib/prisma'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import PersonalLogRunForm from '../../components/PersonalLogRunForm'
import { PARTICIPANTS, plannedKmSoFar, getStatus, grandTotal } from '../../lib/planData'

import DashboardClient from '../../components/Dashboard/DashboardClient'

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
